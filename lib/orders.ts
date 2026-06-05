import { prisma } from "./db";
import {
  calculateChargePrice,
  calculatePayLaterCharge,
  roundMoney,
} from "./billing";
import type { Product } from "./products";

export async function hasUnpaidOrders(userId: string): Promise<boolean> {
  const count = await prisma.order.count({
    where: { userId, status: "PENDING" },
  });
  return count > 0;
}

export async function getUnpaidOrders(userId: string) {
  return prisma.order.findMany({
    where: { userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
}

export type OrderMetadata = {
  actualCharge: number;
  totalDue: number;
  balanceDeducted: number;
  balanceCredit: number;
};

export function parseOrderMetadata(metadata: string | null): OrderMetadata {
  if (!metadata) {
    return {
      actualCharge: 0,
      totalDue: 0,
      balanceDeducted: 0,
      balanceCredit: 0,
    };
  }
  const parsed = JSON.parse(metadata) as Partial<OrderMetadata>;
  return {
    actualCharge: parsed.actualCharge ?? 0,
    totalDue: parsed.totalDue ?? 0,
    balanceDeducted: parsed.balanceDeducted ?? 0,
    balanceCredit: parsed.balanceCredit ?? 0,
  };
}

/**
 * 任务完成后自动结算：
 * - 余额 ≥ 商品价格 → 全额扣余额，订单已付
 * - 余额不足 → 先用后付：先扣尽现有余额，待付金额为不足部分
 */
export async function createOrderAfterTask(params: {
  userId: string;
  product: Product;
  resultUrl: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}) {
  const pricing = calculateChargePrice(params.product.costCny);
  const payLater = calculatePayLaterCharge(params.product.costCny);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: params.userId },
  });

  // 余额充足：直接扣款
  if (user.balance >= pricing.chargeCny) {
    const [, order] = await prisma.$transaction([
      prisma.user.update({
        where: { id: params.userId },
        data: { balance: { decrement: pricing.chargeCny } },
      }),
      prisma.order.create({
        data: {
          userId: params.userId,
          productId: params.product.id,
          status: "PAID",
          costPrice: pricing.costCny,
          chargePrice: pricing.chargeCny,
          paymentMethod: "balance",
          resultUrl: params.resultUrl,
          requestId: params.requestId,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
          paidAt: new Date(),
        },
      }),
    ]);
    return order;
  }

  // 先用后付：先扣余额，剩余待付
  const totalDue = payLater.chargeAmount;
  const balanceDeducted = roundMoney(Math.min(user.balance, totalDue));
  const remainingDue = roundMoney(totalDue - balanceDeducted);

  const orderMeta: OrderMetadata = {
    actualCharge: pricing.chargeCny,
    totalDue,
    balanceDeducted,
    balanceCredit: payLater.balanceCredit,
    ...params.metadata,
  };

  return prisma.$transaction(async (tx) => {
    if (balanceDeducted > 0) {
      await tx.user.update({
        where: { id: params.userId },
        data: { balance: { decrement: balanceDeducted } },
      });
    }
    return tx.order.create({
      data: {
        userId: params.userId,
        productId: params.product.id,
        status: "PENDING",
        costPrice: pricing.costCny,
        chargePrice: remainingDue,
        paymentMethod: "pay_later",
        resultUrl: params.resultUrl,
        requestId: params.requestId,
        metadata: JSON.stringify(orderMeta),
      },
    });
  });
}

export async function payOrderWithBalance(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, status: "PENDING" },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.balance < order.chargePrice) {
    throw new Error("INSUFFICIENT_BALANCE");
  }

  const meta = parseOrderMetadata(order.metadata);

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        balance: roundMoney(
          user.balance - order.chargePrice + meta.balanceCredit,
        ),
      },
    });
    return tx.order.update({
      where: { id: orderId },
      data: { status: "PAID", paidAt: new Date(), paymentMethod: "balance" },
    });
  });
}

export async function payOrderWithAlipay(orderId: string, tradeNo: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
  });
  if (order.status !== "PENDING") return order;

  const meta = parseOrderMetadata(order.metadata);

  return prisma.$transaction(async (tx) => {
    if (meta.balanceCredit > 0) {
      await tx.user.update({
        where: { id: order.userId },
        data: { balance: { increment: meta.balanceCredit } },
      });
    }
    return tx.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentMethod: "alipay",
        requestId: tradeNo,
      },
    });
  });
}

export async function completeRecharge(
  rechargeId: string,
  tradeNo: string,
) {
  const recharge = await prisma.recharge.findUniqueOrThrow({
    where: { id: rechargeId },
  });
  if (recharge.status === "PAID") return recharge;

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: recharge.userId },
      data: { balance: { increment: recharge.amount } },
    });
    return tx.recharge.update({
      where: { id: rechargeId },
      data: { status: "PAID", paidAt: new Date(), alipayTradeNo: tradeNo },
    });
  });
}
