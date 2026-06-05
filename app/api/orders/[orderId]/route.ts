import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProduct } from "@/lib/products";
import { parseOrderMetadata } from "@/lib/orders";
import { getResultUrlStatus, probeResultUrl } from "@/lib/result-url";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const user = await requireUser();
    const { orderId } = await params;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
    });

    if (!order) {
      return NextResponse.json({ error: "订单不存在" }, { status: 404 });
    }

    const meta = parseOrderMetadata(order.metadata);
    const product = getProduct(order.productId);
    const urlStatus = getResultUrlStatus(
      order.resultUrl,
      order.productId,
      order.createdAt,
    );

    let available = !urlStatus.expired && Boolean(order.resultUrl);
    if (available && order.resultUrl) {
      const probe = await probeResultUrl(order.resultUrl);
      if (probe === "expired") {
        available = false;
        urlStatus.expired = true;
      } else if (probe === "available") {
        available = true;
      }
    }

    return NextResponse.json({
      order: {
        id: order.id,
        productId: order.productId,
        productName: product?.name ?? order.productId,
        status: order.status,
        chargePrice: order.chargePrice,
        costPrice: order.costPrice,
        paymentMethod: order.paymentMethod,
        resultUrl: order.resultUrl,
        requestId: order.requestId,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
        balanceDeducted: meta.balanceDeducted,
        totalDue: meta.totalDue,
        product: product
          ? {
              service: product.service,
              model: product.model,
              icon: product.icon,
            }
          : null,
        result: {
          expired: urlStatus.expired || !available,
          expiresAt: urlStatus.expiresAt?.toISOString() ?? null,
          available,
          source: urlStatus.source,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
}
