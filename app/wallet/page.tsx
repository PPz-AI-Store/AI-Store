"use client";

import { useEffect, useState } from "react";
import { formatCny } from "@/lib/billing";

const QUICK_AMOUNTS = [0.1, 0.5, 1, 5, 10];

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function refresh() {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setBalance(d.user?.balance ?? null));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function recharge(value: number) {
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/wallet/recharge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "充值失败");
      setLoading(false);
      return;
    }
    if (data.devMode) {
      setBalance(data.balance);
      setMessage(data.message);
    } else if (data.payUrl) {
      window.location.href = data.payUrl;
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">钱包</h1>
      <p className="mt-1 text-sm text-zinc-500">余额充值 · 支付宝支付</p>

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-500">当前余额</p>
        <p className="mt-1 text-3xl font-bold text-violet-600 dark:text-violet-400">
          {balance !== null ? formatCny(balance) : "—"}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <p className="text-sm font-medium">快捷充值</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((a) => (
            <button
              key={a}
              type="button"
              disabled={loading}
              onClick={() => recharge(a)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:border-violet-400 hover:bg-violet-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-violet-950/30"
            >
              ¥{a}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm text-zinc-500">自定义金额（元）</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => recharge(Number(amount))}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-50"
            >
              支付宝充值
            </button>
          </div>
        </div>

        {message && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
        )}
      </div>
    </div>
  );
}
