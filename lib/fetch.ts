import { Agent, fetch as undiciFetch } from "undici";

const DEFAULT_CONNECT_TIMEOUT_MS = 30_000;
const DEFAULT_HEADERS_TIMEOUT_MS = 180_000;
const DEFAULT_BODY_TIMEOUT_MS = 180_000;

const longRunningAgent = new Agent({
  connect: { timeout: DEFAULT_CONNECT_TIMEOUT_MS },
  headersTimeout: DEFAULT_HEADERS_TIMEOUT_MS,
  bodyTimeout: DEFAULT_BODY_TIMEOUT_MS,
});

export type LongFetchOptions = {
  /** 整体请求超时（含连接 + 响应体），默认 3 分钟 */
  timeoutMs?: number;
  connectTimeoutMs?: number;
};

/**
 * 用于百炼等耗时较长的 API：放宽连接超时与整体超时。
 * Node 内置 fetch 默认连接超时仅 10s，易导致 ConnectTimeoutError。
 */
export async function fetchLongRunning(
  url: string,
  init?: RequestInit,
  options?: LongFetchOptions,
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? 180_000;
  const connectTimeoutMs = options?.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;

  const agent =
    connectTimeoutMs === DEFAULT_CONNECT_TIMEOUT_MS
      ? longRunningAgent
      : new Agent({
          connect: { timeout: connectTimeoutMs },
          headersTimeout: timeoutMs,
          bodyTimeout: timeoutMs,
        });

  const signal = AbortSignal.timeout(timeoutMs);

  try {
    const response = await undiciFetch(url, {
      ...(init as Parameters<typeof undiciFetch>[1]),
      signal,
      dispatcher: agent,
    });
    return response as unknown as Response;
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        throw new Error(
          `请求超时（${Math.round(timeoutMs / 1000)} 秒内未收到完整响应），请稍后重试`,
        );
      }
      if (
        err.message.includes("Connect Timeout") ||
        (err as { code?: string }).code === "UND_ERR_CONNECT_TIMEOUT"
      ) {
        throw new Error(
          "无法连接 AI 服务，请检查网络或代理设置后重试",
        );
      }
    }
    throw err;
  }
}
