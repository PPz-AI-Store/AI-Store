import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { TRIAL_BALANCE_CNY } from "./billing";

const SESSION_COOKIE = "ai_store_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-production",
);

export type SessionUser = {
  id: string;
  openId: string;
  nickname: string | null;
  avatar: string | null;
  balance: number;
};

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub;
    if (!userId) return null;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    return {
      id: user.id,
      openId: user.openId,
      nickname: user.nickname,
      avatar: user.avatar,
      balance: user.balance,
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export function getWeChatAuthUrl(state: string): string {
  const appId = process.env.WECHAT_APP_ID;
  const redirectUri = encodeURIComponent(
    process.env.WECHAT_REDIRECT_URI ??
      "http://localhost:3000/api/auth/wechat/callback",
  );
  return `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
}

export async function exchangeWeChatCode(code: string) {
  const appId = process.env.WECHAT_APP_ID;
  const appSecret = process.env.WECHAT_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("WECHAT_NOT_CONFIGURED");
  }

  const tokenRes = await fetch(
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`,
  );
  const tokenData = (await tokenRes.json()) as {
    access_token?: string;
    openid?: string;
    unionid?: string;
    errcode?: number;
    errmsg?: string;
  };

  if (!tokenData.access_token || !tokenData.openid) {
    throw new Error(tokenData.errmsg ?? "微信授权失败");
  }

  const userRes = await fetch(
    `https://api.weixin.qq.com/sns/userinfo?access_token=${tokenData.access_token}&openid=${tokenData.openid}&lang=zh_CN`,
  );
  const userData = (await userRes.json()) as {
    nickname?: string;
    headimgurl?: string;
    openid?: string;
    unionid?: string;
  };

  return {
    openId: tokenData.openid,
    unionId: tokenData.unionid ?? userData.unionid,
    nickname: userData.nickname,
    avatar: userData.headimgurl,
  };
}

export async function findOrCreateWeChatUser(profile: {
  openId: string;
  unionId?: string;
  nickname?: string;
  avatar?: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { openId: profile.openId },
  });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        nickname: profile.nickname ?? existing.nickname,
        avatar: profile.avatar ?? existing.avatar,
        unionId: profile.unionId ?? existing.unionId,
      },
    });
  }

  return prisma.user.create({
    data: {
      openId: profile.openId,
      unionId: profile.unionId,
      nickname: profile.nickname,
      avatar: profile.avatar,
      balance: TRIAL_BALANCE_CNY,
    },
  });
}

/** 开发模式：无微信配置时可用 */
export async function devLogin(nickname = "测试用户") {
  const openId = `dev_${nickname}`;
  const user = await findOrCreateWeChatUser({ openId, nickname });
  const token = await createSessionToken(user.id);
  await setSessionCookie(token);
  return user;
}
