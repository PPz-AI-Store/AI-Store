"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";

type Props = {
  product: Product;
};

const STEPS = [
  "上传图片",
  "调用 AI 服务",
  "生成结果",
  "创建订单",
];

export function TaskProcessingPanel({ product }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const typicalWait = product.typicalWaitSec ?? 15;
  const isSlow = (product.typicalWaitSec ?? 0) >= 30;

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const progress = Math.min(
    95,
    isSlow
      ? Math.round((elapsed / typicalWait) * 80) + 5
      : Math.min(90, elapsed * 8 + 10),
  );

  const activeStep = isSlow
    ? elapsed < 3
      ? 0
      : elapsed < typicalWait * 0.7
        ? 1
        : 2
    : elapsed < 2
      ? 0
      : elapsed < 8
        ? 1
        : 2;

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl border border-violet-200 bg-violet-50/80 p-6 dark:border-violet-900/50 dark:bg-violet-950/30"
    >
      <div className="flex items-start gap-4">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-violet-400/30" />
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-lg text-white">
            {product.icon}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-violet-900 dark:text-violet-100">
            正在处理：{product.name}
          </p>
          <p className="mt-1 text-sm text-violet-700/90 dark:text-violet-300/90">
            {isSlow
              ? `百炼图像生成通常需要 ${typicalWait} 秒以上，请耐心等待…`
              : "AI 正在分析并处理您的图片…"}
          </p>
          <p className="mt-2 font-mono text-xs text-violet-600 dark:text-violet-400">
            已等待 {elapsed} 秒
            {isSlow && elapsed < typicalWait && (
              <span className="ml-2 text-violet-500">
                · 预计还需约 {Math.max(1, typicalWait - elapsed)} 秒
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-2 overflow-hidden rounded-full bg-violet-200 dark:bg-violet-900/60">
          <div
            className="h-full rounded-full bg-violet-600 transition-all duration-1000 ease-out dark:bg-violet-400"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2">
        {STEPS.map((label, i) => {
          const done = i < activeStep;
          const current = i === activeStep;
          return (
            <li
              key={label}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                current
                  ? "bg-white/80 font-medium text-violet-800 shadow-sm dark:bg-violet-900/40 dark:text-violet-100"
                  : done
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-violet-400/70 dark:text-violet-500/70"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                  done
                    ? "bg-violet-600 text-white"
                    : current
                      ? "border-2 border-violet-600 text-violet-600"
                      : "border border-violet-300 text-transparent"
                }`}
              >
                {done ? "✓" : current ? "…" : ""}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-xs text-violet-600/80 dark:text-violet-400/80">
        请勿关闭页面。处理完成后将自动展示结果。
      </p>
    </div>
  );
}
