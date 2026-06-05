import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { payOrderWithBalance } from "@/lib/orders";
import { createAlipayPagePay, isAlipayConfigured } from "@/lib/alipay";
import { getProduct } from "@/lib/products";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const user = await requireUser();
    const { orderId } = await params;
    const body = (await request.json()) as { method?: "balance" | "alipay" };
    const method = body.method ?? "balance";

    if (method === "balance") {
      const order = await payOrderWithBalance(orderId, user.id);
      return NextResponse.json({ order, paid: true });
    }

    if (!isAlipayConfigured()) {
      return NextResponse.json(
        { error: "支付宝未配置，请使用余额支付或联系管理员" },
        { status: 503 },
      );
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id, status: "PENDING" },
    });
    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    const product = getProduct(order.productId);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const payUrl = await createAlipayPagePay({
      outTradeNo: orderId,
      totalAmount: order.chargePrice,
      subject: `AI Store - ${product?.name ?? order.productId}`,
      returnUrl: `${baseUrl}/orders?paid=${orderId}`,
      notifyUrl: `${baseUrl}/api/payment/alipay/notify`,
    });

    return NextResponse.json({ payUrl, paid: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "支付失败";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "余额不足" }, { status: 402 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
