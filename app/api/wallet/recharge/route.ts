import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAlipayPagePay, isAlipayConfigured } from "@/lib/alipay";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = (await request.json()) as { amount?: number };
    const amount = body.amount;

    if (!amount || amount < 0.01 || amount > 10000) {
      return NextResponse.json(
        { error: "充值金额需在 0.01 ~ 10000 元之间" },
        { status: 400 },
      );
    }

    if (!isAlipayConfigured()) {
      // 开发模式：直接充值
      if (process.env.NODE_ENV !== "production") {
        await prisma.user.update({
          where: { id: user.id },
          data: { balance: { increment: amount } },
        });
        const updated = await prisma.user.findUniqueOrThrow({
          where: { id: user.id },
        });
        return NextResponse.json({
          devMode: true,
          balance: updated.balance,
          message: "开发模式已直接充值",
        });
      }
      return NextResponse.json({ error: "支付宝未配置" }, { status: 503 });
    }

    const recharge = await prisma.recharge.create({
      data: { userId: user.id, amount, status: "PENDING" },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const payUrl = await createAlipayPagePay({
      outTradeNo: `recharge_${recharge.id}`,
      totalAmount: amount,
      subject: `AI Store 余额充值 ¥${amount}`,
      returnUrl: `${baseUrl}/wallet?recharged=${recharge.id}`,
      notifyUrl: `${baseUrl}/api/payment/alipay/notify`,
    });

    return NextResponse.json({ payUrl, rechargeId: recharge.id });
  } catch {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
}
