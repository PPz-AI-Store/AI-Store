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

export type PaymentMethod = "balance" | "pay_later" | "alipay";

export async function createOrderAfterTask(params: {
  userId: string;
  product: Product;
  resultUrl: string;
  requestId?: string;
  paymentMethod: PaymentMethod;
  metadata?: Record<string, unknown>;
}) {
  const pricing = calculateChargePrice(params.product.costCny);

  if (params.paymentMethod === "balance") {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: params.userId },
    });
    if (user.balance < pricing.chargeCny) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

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

  // 先用后付
  const payLater = calculatePayLaterCharge(params.product.costCny);
  const order = await prisma.order.create({
    data: {
      userId: params.userId,
      productId: params.product.id,
      status: "PENDING",
      costPrice: pricing.costCny,
      chargePrice: payLater.chargeAmount,
      paymentMethod: "pay_later",
      resultUrl: params.resultUrl,
      requestId: params.requestId,
      metadata: JSON.stringify({
        ...params.metadata,
        balanceCredit: payLater.balanceCredit,
        actualCharge: pricing.chargeCny,
      }),
    },
  });
  return order;
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

  const meta = order.metadata ? JSON.parse(order.metadata) : {};
  const balanceCredit = meta.balanceCredit ?? 0;

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        balance: roundMoney(user.balance - order.chargePrice + balanceCredit),
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

  const meta = order.metadata ? JSON.parse(order.metadata) : {};
  const balanceCredit = meta.balanceCredit ?? 0;

  return prisma.$transaction(async (tx) => {
    if (balanceCredit > 0) {
      await tx.user.update({
        where: { id: order.userId },
        data: { balance: { increment: balanceCredit } },
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
