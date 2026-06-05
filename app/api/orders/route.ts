import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProduct } from "@/lib/products";
import { parseOrderMetadata } from "@/lib/orders";

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((o) => {
        const meta = parseOrderMetadata(o.metadata);
        return {
          ...o,
          productName: getProduct(o.productId)?.name ?? o.productId,
          balanceDeducted: meta.balanceDeducted,
          totalDue: meta.totalDue,
        };
      }),
    });
  } catch {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
}
