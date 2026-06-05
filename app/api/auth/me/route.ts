import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { hasUnpaidOrders } from "@/lib/orders";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  const unpaid = await hasUnpaidOrders(user.id);
  return NextResponse.json({ user, hasUnpaidOrders: unpaid });
}
