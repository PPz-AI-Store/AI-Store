import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProduct } from "@/lib/products";

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        ...o,
        productName: getProduct(o.productId)?.name ?? o.productId,
      })),
    });
  } catch {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
}
