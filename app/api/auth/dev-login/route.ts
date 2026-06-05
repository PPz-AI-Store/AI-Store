import { NextRequest, NextResponse } from "next/server";
import { devLogin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_LOGIN !== "true") {
    return NextResponse.json({ error: "开发登录已禁用" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    nickname?: string;
  };
  const user = await devLogin(body.nickname ?? "测试用户");

  return NextResponse.json({
    id: user.id,
    nickname: user.nickname,
    balance: user.balance,
  });
}
