"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import type { PriceBreakdown } from "@/lib/billing";
import { formatCny } from "@/lib/billing";
import { PricingPanel } from "./PricingPanel";

type Props = {
  product: Product;
  pricing: PriceBreakdown;
};

type TaskResult = {
  resultUrl: string;
  order: {
    id: string;
    status: string;
    chargePrice: number;
    paymentMethod: string | null;
    balanceDeducted?: number;
    totalDue?: number;
  };
};

export function ProductWorkspace({ product, pricing }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [hasUnpaid, setHasUnpaid] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  function refreshUser() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setHasUnpaid(d.hasUnpaidOrders ?? false);
        setBalance(d.user?.balance ?? null);
      });
  }

  useEffect(() => {
    refreshUser();
  }, []);

  const onFile = useCallback((f: File | null) => {
    setFile(f);
    setResult(null);
    setError(null);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("请先上传图片");
      return;
    }
    if (hasUnpaid) {
      setError("您有未结算订单，请先到订单页完成付款");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);
    if (product.needsPrompt && prompt) formData.append("prompt", prompt);
    if (product.id === "super-resolution") {
      formData.append("upscaleFactor", String(upscaleFactor));
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "UNPAID_ORDERS") setHasUnpaid(true);
        throw new Error(data.error ?? "处理失败");
      }
      setResult(data);
      refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "处理失败");
    } finally {
      setLoading(false);
    }
  }

  async function payOrder(method: "balance" | "alipay") {
    if (!result) return;
    const res = await fetch(`/api/orders/${result.order.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "支付失败");
      return;
    }
    if (data.payUrl) {
      window.location.href = data.payUrl;
      return;
    }
    setResult({
      ...result,
      order: { ...result.order, status: "PAID", paymentMethod: method },
    });
    setHasUnpaid(false);
    refreshUser();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-6">
        {hasUnpaid && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            您有未结算订单，请先{" "}
            <a href="/orders" className="font-medium underline">
              完成付款
            </a>{" "}
            后再使用本功能。
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 transition hover:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900/30"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.type.startsWith("image/")) onFile(f);
            }}
          >
            <input
              type="file"
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="预览"
                className="max-h-64 max-w-full rounded-lg object-contain"
              />
            ) : (
              <p className="text-center text-sm text-zinc-500">
                点击或拖拽上传图片
                <br />
                <span className="text-xs">直接上传至阿里云临时 OSS</span>
              </p>
            )}
          </div>

          {product.needsPrompt && (
            <div>
              <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
                附加要求（可选）
              </label>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={product.promptHint}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          )}

          {product.id === "super-resolution" && (
            <div>
              <label className="mb-1 block text-sm text-zinc-600 dark:text-zinc-400">
                放大倍数
              </label>
              <select
                value={upscaleFactor}
                onChange={(e) => setUpscaleFactor(Number(e.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
              </select>
            </div>
          )}

          {balance !== null && (
            <p className="text-sm text-zinc-500">
              当前余额 {formatCny(balance)}
              {balance >= pricing.chargeCny
                ? "，将自动从余额扣款"
                : "，不足部分将先用后付"}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || hasUnpaid || !file}
            className="w-full rounded-xl bg-violet-600 py-3 font-medium text-white transition hover:bg-violet-500 disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {loading ? "处理中…" : `开始任务 · ${formatCny(pricing.chargeCny)}`}
          </button>
        </form>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="font-semibold">处理结果</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.resultUrl}
              alt="结果"
              className="max-w-full rounded-lg"
            />
            <p className="text-sm text-zinc-500">
              结果链接有效期约 30 分钟，请及时下载保存。
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={result.resultUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                下载结果
              </a>
              {result.order.status === "PENDING" && (
                <>
                  {(result.order.balanceDeducted ?? 0) > 0 && (
                    <span className="self-center text-sm text-zinc-500">
                      已从余额抵扣 {formatCny(result.order.balanceDeducted!)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => payOrder("balance")}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-500"
                  >
                    余额支付 {formatCny(result.order.chargePrice)}
                  </button>
                  <button
                    type="button"
                    onClick={() => payOrder("alipay")}
                    className="rounded-lg bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-500"
                  >
                    支付宝支付 {formatCny(result.order.chargePrice)}
                  </button>
                </>
              )}
              {result.order.status === "PAID" && (
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
                  已付款
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <aside>
        <PricingPanel product={product} pricing={pricing} />
      </aside>
    </div>
  );
}
