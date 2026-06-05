"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const params = useSearchParams();
  const error = params.get("error");
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState("测试用户");

  async function devLogin() {
    setLoading(true);
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    if (res.ok) {
      window.location.href = "/";
    } else {
      const data = await res.json();
      alert(data.error ?? "登录失败");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-center text-2xl font-bold">登录 AI Store</h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        仅支持微信登录
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-center text-sm text-red-700 dark:bg-red-950/40">
          登录失败，请重试
        </p>
      )}

      <a
        href="/api/auth/wechat"
        className="mt-8 flex items-center justify-center gap-2 rounded-xl bg-[#07C160] py-3 font-medium text-white hover:bg-[#06ad56]"
      >
        <span>微信登录</span>
      </a>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[var(--background)] px-2 text-zinc-500">
            开发模式
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="昵称"
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="button"
          onClick={devLogin}
          disabled={loading}
          className="w-full rounded-xl border border-zinc-300 py-3 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          {loading ? "登录中…" : "开发模式快速登录"}
        </button>
        <p className="text-center text-xs text-zinc-500">
          新用户自动获得 ¥0.1 体验余额
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-zinc-500">加载中…</div>}>
      <LoginForm />
    </Suspense>
  );
}
