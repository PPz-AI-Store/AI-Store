import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getProduct, type ProductId } from "@/lib/products";
import { getProductPricing } from "@/lib/billing";
import { hasUnpaidOrders, createOrderAfterTask } from "@/lib/orders";
import { acquireRateLimit } from "@/lib/rate-limit";
import { processProduct } from "@/lib/aliyun/process";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const user = await requireUser();
    const { productId } = await params;
    const product = getProduct(productId);

    if (!product) {
      return NextResponse.json({ error: "产品不存在" }, { status: 404 });
    }

    if (await hasUnpaidOrders(user.id)) {
      return NextResponse.json(
        {
          error: "您有未结算的订单，请先完成付款后再使用",
          code: "UNPAID_ORDERS",
        },
        { status: 402 },
      );
    }

    const rateCheck = acquireRateLimit(
      productId as ProductId,
      product.qps,
    );
    if (!rateCheck.ok) {
      return NextResponse.json(
        {
          error: `请求过于频繁，请 ${Math.ceil(rateCheck.retryAfterMs / 1000)} 秒后重试`,
          code: "RATE_LIMITED",
        },
        { status: 429 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");
    const paymentMethod = (formData.get("paymentMethod") as string) ?? "pay_later";
    const prompt = formData.get("prompt") as string | null;
    const upscaleFactor = formData.get("upscaleFactor")
      ? Number(formData.get("upscaleFactor"))
      : 2;

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "请上传图片" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "图片为空" }, { status: 400 });
    }

    let imageBase64: string | undefined;
    if (
      productId === "id-photo" ||
      productId === "remove-background-people"
    ) {
      const mime = file.type || "image/jpeg";
      imageBase64 = `data:${mime};base64,${buffer.toString("base64")}`;
    }

    const result = await processProduct(productId as ProductId, buffer, {
      prompt: prompt ?? undefined,
      upscaleFactor,
      imageBase64,
    });

    const pricing = getProductPricing(product);
    const validPayment =
      paymentMethod === "balance" ? "balance" : "pay_later";

    if (validPayment === "balance" && user.balance < pricing.chargeCny) {
      return NextResponse.json(
        {
          error: `余额不足，需要 ${pricing.chargeCny} 元，当前余额 ${user.balance} 元`,
          code: "INSUFFICIENT_BALANCE",
        },
        { status: 402 },
      );
    }

    const order = await createOrderAfterTask({
      userId: user.id,
      product,
      resultUrl: result.resultUrl,
      requestId: result.requestId,
      paymentMethod: validPayment,
    });

    return NextResponse.json({
      resultUrl: result.resultUrl,
      requestId: result.requestId,
      order: {
        id: order.id,
        status: order.status,
        chargePrice: order.chargePrice,
        costPrice: order.costPrice,
        paymentMethod: order.paymentMethod,
      },
      pricing,
      product: {
        name: product.name,
        service: product.service,
        model: product.model,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "处理失败";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    if (message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ error: "余额不足" }, { status: 402 });
    }
    console.error("[product]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }

  const pricing = getProductPricing(product);
  return NextResponse.json({ product, pricing });
}
