import type { ProductId } from "./products";

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

/**
 * 简单内存令牌桶，按产品 QPS 限流。
 * 生产环境建议换 Redis 等分布式限流。
 */
export function acquireRateLimit(
  productId: ProductId,
  qps: number,
): { ok: true } | { ok: false; retryAfterMs: number } {
  const key = `product:${productId}`;
  const now = Date.now();
  const intervalMs = 1000 / qps;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: qps, lastRefill: now };
    buckets.set(key, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor(elapsed / intervalMs);
  if (refill > 0) {
    bucket.tokens = Math.min(qps, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    const waitMs = intervalMs - (now - bucket.lastRefill);
    return { ok: false, retryAfterMs: Math.max(waitMs, 100) };
  }

  bucket.tokens -= 1;
  return { ok: true };
}
