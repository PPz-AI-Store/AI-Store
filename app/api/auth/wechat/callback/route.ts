import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  exchangeWeChatCode,
  findOrCreateWeChatUser,
  setSessionCookie,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", request.url));
  }

  try {
    const profile = await exchangeWeChatCode(code);
    const user = await findOrCreateWeChatUser(profile);
    const token = await createSessionToken(user.id);
    await setSessionCookie(token);
    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }
}
