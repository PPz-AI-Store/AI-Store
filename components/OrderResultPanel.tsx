"use client";

import { formatCny } from "@/lib/billing";

export type OrderResultData = {
  id: string;
  productName: string;
  status: string;
  chargePrice: number;
  costPrice: number;
  paymentMethod: string | null;
  resultUrl: string | null;
  createdAt: string;
  balanceDeducted?: number;
  result: {
    expired: boolean;
    expiresAt: string | null;
    available: boolean;
    source: string;
  };
};

type Props = {
  order: OrderResultData;
  onPay?: (method: "balance" | "alipay") => void;
  compact?: boolean;
};

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN");
}

export function OrderResultPanel({ order, onPay, compact }: Props) {
  const { result } = order;
  const showImage = order.resultUrl && result.available && !result.expired;

  return (
    <div className={compact ? "space-y-3" : "space-y-6"}>
      {!compact && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">{order.productName}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              订单 {order.id.slice(0, 8)}… ·{" "}
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              order.status === "PENDING"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
            }`}
          >
            {order.status === "PENDING" ? "待付款" : "已付款"}
          </span>
        </div>
      )}

      <div
        className={`overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 ${
          compact ? "min-h-[120px]" : "min-h-[200px]"
        }`}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={order.resultUrl!}
            alt="处理结果"
            className="mx-auto max-h-96 w-full object-contain"
          />
        ) : (
          <div className="flex min-h-[inherit] flex-col items-center justify-center gap-2 p-8 text-center">
            <span className="text-4xl opacity-40">🖼️</span>
            <p className="font-medium text-zinc-600 dark:text-zinc-400">
              {result.expired ? "结果链接已过期" : "暂无可用结果"}
            </p>
            <p className="max-w-sm text-sm text-zinc-500">
              {result.expired
                ? "阿里云临时链接有效期已过，无法再次下载。如需重新处理，请再次使用对应功能。"
                : "结果链接暂时无法访问，请稍后刷新页面重试。"}
            </p>
            {result.expiresAt && (
              <p className="text-xs text-zinc-400">
                过期时间：{formatDateTime(result.expiresAt)}
              </p>
            )}
          </div>
        )}
      </div>

      {showImage && (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={order.resultUrl!}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            下载结果
          </a>
          {result.expiresAt && (
            <span className="text-sm text-zinc-500">
              链接将于 {formatDateTime(result.expiresAt)} 过期
              {result.source === "estimated" && "（预估）"}
            </span>
          )}
        </div>
      )}

      {!compact && (
        <dl className="grid gap-3 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800 sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">费用</dt>
            <dd className="font-medium">
              {order.status === "PENDING" ? "待付 " : ""}
              {formatCny(order.chargePrice)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">成本</dt>
            <dd>{formatCny(order.costPrice)}</dd>
          </div>
          {(order.balanceDeducted ?? 0) > 0 && (
            <div>
              <dt className="text-zinc-500">已从余额抵扣</dt>
              <dd>{formatCny(order.balanceDeducted!)}</dd>
            </div>
          )}
          <div>
            <dt className="text-zinc-500">支付方式</dt>
            <dd>
              {order.paymentMethod === "balance"
                ? "余额"
                : order.paymentMethod === "alipay"
                  ? "支付宝"
                  : order.paymentMethod === "pay_later"
                    ? "先用后付"
                    : "—"}
            </dd>
          </div>
        </dl>
      )}

      {order.status === "PENDING" && onPay && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onPay("balance")}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            余额支付 {formatCny(order.chargePrice)}
          </button>
          <button
            type="button"
            onClick={() => onPay("alipay")}
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-500"
          >
            支付宝支付 {formatCny(order.chargePrice)}
          </button>
        </div>
      )}
    </div>
  );
}
