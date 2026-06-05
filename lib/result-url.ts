import { getProduct } from "./products";

/** 视觉智能临时链接默认有效期（分钟） */
const VIAPI_TTL_MINUTES = 30;
/** 百炼图像结果默认有效期（小时） */
const BAILIAN_TTL_HOURS = 24;

export type ResultUrlStatus = {
  expired: boolean;
  expiresAt: Date | null;
  source: "url" | "estimated" | "unknown";
};

/** 从 OSS 签名 URL 解析 Expires 参数（Unix 秒） */
export function parseExpiresFromUrl(url: string): Date | null {
  try {
    const parsed = new URL(url);
    const expires = parsed.searchParams.get("Expires");
    if (expires && /^\d+$/.test(expires)) {
      return new Date(Number(expires) * 1000);
    }
  } catch {
    // ignore invalid URL
  }
  return null;
}

export function estimateResultExpiry(
  resultUrl: string,
  productId: string,
  createdAt: Date,
): Date {
  const fromUrl = parseExpiresFromUrl(resultUrl);
  if (fromUrl) return fromUrl;

  const product = getProduct(productId);
  const isBailian = product?.service.includes("百炼");
  const ttlMs = isBailian
    ? BAILIAN_TTL_HOURS * 60 * 60 * 1000
    : VIAPI_TTL_MINUTES * 60 * 1000;

  return new Date(createdAt.getTime() + ttlMs);
}

export function getResultUrlStatus(
  resultUrl: string | null | undefined,
  productId: string,
  createdAt: Date,
): ResultUrlStatus {
  if (!resultUrl) {
    return { expired: true, expiresAt: null, source: "unknown" };
  }

  const fromUrl = parseExpiresFromUrl(resultUrl);
  if (fromUrl) {
    return {
      expired: Date.now() > fromUrl.getTime(),
      expiresAt: fromUrl,
      source: "url",
    };
  }

  const estimated = estimateResultExpiry(resultUrl, productId, createdAt);
  return {
    expired: Date.now() > estimated.getTime(),
    expiresAt: estimated,
    source: "estimated",
  };
}

/** 服务端探测链接是否仍可访问（HEAD，短超时） */
export async function probeResultUrl(
  resultUrl: string,
): Promise<"available" | "expired" | "unknown"> {
  try {
    const response = await undiciHead(resultUrl);
    if (response.ok) return "available";
    if (response.status === 403 || response.status === 404) return "expired";
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function undiciHead(url: string) {
  const { Agent, fetch } = await import("undici");
  const agent = new Agent({ connect: { timeout: 8_000 } });
  return fetch(url, {
    method: "HEAD",
    dispatcher: agent,
    signal: AbortSignal.timeout(10_000),
  }) as unknown as Response;
}
