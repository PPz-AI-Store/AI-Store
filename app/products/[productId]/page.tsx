import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductWorkspace } from "@/components/ProductWorkspace";
import { getProduct } from "@/lib/products";
import { getProductPricing } from "@/lib/billing";

type Props = {
  params: Promise<{ productId: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) notFound();

  const pricing = getProductPricing(product);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-block text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        ← 返回商店
      </Link>
      <div className="mb-8">
        <span className="text-3xl">{product.icon}</span>
        <h1 className="mt-2 text-2xl font-bold">{product.name}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          {product.description}
        </p>
      </div>
      <ProductWorkspace product={product} pricing={pricing} />
    </div>
  );
}
