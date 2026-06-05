import Link from "next/link";
import { PRODUCT_LIST } from "@/lib/products";
import { getProductPricing, formatCny } from "@/lib/billing";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          AI Store
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-zinc-600 dark:text-zinc-400">
          像 App Store 卖 App 一样，我们按使用量出售 AI 能力。
          擦除一张背景约 ¥0.01，用多少付多少。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
            按次计费
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            新用户 ¥0.1 体验余额
          </span>
          <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
            先用后付
          </span>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_LIST.map((product) => {
          const pricing = getProductPricing(product);
          return (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-violet-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-violet-700"
            >
              <div className="mb-3 text-3xl">{product.icon}</div>
              <h2 className="font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400">
                {product.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                {product.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="font-medium text-violet-600 dark:text-violet-400">
                  {formatCny(pricing.chargeCny)} / 次
                  {pricing.atCost && (
                    <span className="ml-1 text-xs text-emerald-600">成本价</span>
                  )}
                </span>
                <span className="text-zinc-400">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
