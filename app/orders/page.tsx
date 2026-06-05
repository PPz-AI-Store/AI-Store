"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCny } from "@/lib/billing";

type Order = {
  id: string;
  productId: string;
  productName: string;
  status: string;
  chargePrice: number;
  costPrice: number;
  resultUrl: string | null;
  createdAt: string;
  paymentMethod: string | null;
  balanceDeducted?: number;
  totalDue?: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders ?? []);
        setLoading(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function pay(orderId: string, method: "balance" | "alipay") {
    const res = await fetch(`/api/orders/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method }),
    });
    const data = await res.json();
    if (data.payUrl) {
      window.location.href = data.payUrl;
      return;
    }
    if (res.ok) load();
    else alert(data.error ?? "支付失败");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">我的订单</h1>
      <p className="mt-1 text-sm text-zinc-500">
        点击订单查看详情与下载结果
      </p>

      {loading ? (
        <p className="mt-8 text-zinc-500">加载中…</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-zinc-500">暂无订单</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-xl border border-zinc-200 p-4 transition hover:border-violet-300 dark:border-zinc-800 dark:hover:border-violet-800"
            >
              <Link href={`/orders/${order.id}`} className="block">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{order.productName}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(order.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.status === "PENDING"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                    }`}
                  >
                    {order.status === "PENDING" ? "待付款" : "已付款"}
                  </span>
                </div>
                <p className="mt-2 text-sm">
                  {order.status === "PENDING" ? "待付" : "费用"}{" "}
                  {formatCny(order.chargePrice)}
                  {(order.balanceDeducted ?? 0) > 0 && (
                    <span className="ml-2 text-zinc-400">
                      已抵扣 {formatCny(order.balanceDeducted!)}
                    </span>
                  )}
                </p>
              </Link>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/orders/${order.id}`}
                  className="rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  查看详情
                </Link>
                {order.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => pay(order.id, "balance")}
                      className="rounded-lg bg-violet-600 px-3 py-1 text-xs text-white hover:bg-violet-500"
                    >
                      余额支付 {formatCny(order.chargePrice)}
                    </button>
                    <button
                      type="button"
                      onClick={() => pay(order.id, "alipay")}
                      className="rounded-lg bg-sky-600 px-3 py-1 text-xs text-white hover:bg-sky-500"
                    >
                      支付宝 {formatCny(order.chargePrice)}
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
