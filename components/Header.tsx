"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCny } from "@/lib/billing";

type UserInfo = {
  id: string;
  nickname: string | null;
  balance: number;
};

export function Header() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [hasUnpaid, setHasUnpaid] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setHasUnpaid(d.hasUnpaidOrders ?? false);
      })
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-xl">🤖</span>
          <span>AI Store</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm sm:gap-5">
          <Link href="/wallet" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            钱包
          </Link>
          <Link href="/orders" className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            订单
          </Link>
          {user ? (
            <div className="flex items-center gap-3">
              {hasUnpaid && (
                <Link
                  href="/orders"
                  className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                >
                  待付款
                </Link>
              )}
              <span className="hidden text-zinc-500 sm:inline">
                {user.nickname ?? "用户"}
              </span>
              <span className="font-medium text-violet-600 dark:text-violet-400">
                {formatCny(user.balance)}
              </span>
              <button
                type="button"
                onClick={logout}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-violet-600 px-3 py-1.5 font-medium text-white hover:bg-violet-500"
            >
              登录
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
