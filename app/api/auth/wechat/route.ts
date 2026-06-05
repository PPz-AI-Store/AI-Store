import { NextResponse } from "next/server";
import { getWeChatAuthUrl } from "@/lib/auth";

export async function GET() {
  if (!process.env.WECHAT_APP_ID) {
    return NextResponse.json(
      { error: "微信登录未配置，请使用开发模式登录" },
      { status: 503 },
    );
  }
  const state = crypto.randomUUID();
  const url = getWeChatAuthUrl(state);
  return NextResponse.redirect(url);
}
