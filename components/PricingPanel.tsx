import type { Product } from "@/lib/products";
import type { PriceBreakdown } from "@/lib/billing";
import { formatCny } from "@/lib/billing";

type Props = {
  product: Product;
  pricing: PriceBreakdown;
};

export function PricingPanel({ product, pricing }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
      <h3 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        价格与服务信息
      </h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">调用服务</dt>
          <dd className="text-right font-medium">{product.service}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">模型 / API</dt>
          <dd className="text-right font-mono text-xs">{product.model}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">成本价</dt>
          <dd>{formatCny(pricing.costCny)} / 次</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-zinc-200 pt-2 dark:border-zinc-700">
          <dt className="text-zinc-500">您的价格</dt>
          <dd className="font-semibold text-violet-600 dark:text-violet-400">
            {formatCny(pricing.chargeCny)} / 次
            {pricing.atCost && (
              <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-normal text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                成本价
              </span>
            )}
          </dd>
        </div>
        {pricing.markupNote && (
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {pricing.markupNote}
          </p>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-zinc-500">QPS 限制</dt>
          <dd>{product.qps} 次/秒</dd>
        </div>
      </dl>
      <a
        href={product.docUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs text-violet-600 hover:underline dark:text-violet-400"
      >
        查看官方文档 →
      </a>
    </div>
  );
}
