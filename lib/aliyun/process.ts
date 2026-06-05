import type { ProductId } from "../products";
import { getProduct } from "../products";
import {
  segmentBody,
  segmentHDBody,
  segmentHDCommon,
} from "./imageseg";
import { makeSuperResolution } from "./imageenhan";
import {
  generateIdPhoto,
  removeBackgroundPeople,
} from "./dashscope";

export async function processProduct(
  productId: ProductId,
  buffer: Buffer,
  options?: { prompt?: string; upscaleFactor?: number; imageBase64?: string },
): Promise<{ resultUrl: string; requestId?: string }> {
  const product = getProduct(productId);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");

  switch (productId) {
    case "body-segment": {
      const res = await segmentBody(buffer);
      return { resultUrl: res.imageUrl, requestId: res.requestId };
    }
    case "hd-body-segment": {
      const res = await segmentHDBody(buffer);
      return { resultUrl: res.imageUrl, requestId: res.requestId };
    }
    case "hd-common-segment": {
      const res = await segmentHDCommon(buffer);
      return { resultUrl: res.imageUrl, requestId: res.requestId };
    }
    case "super-resolution": {
      const res = await makeSuperResolution(
        buffer,
        options?.upscaleFactor ?? 2,
      );
      return { resultUrl: res.imageUrl, requestId: res.requestId };
    }
    case "id-photo": {
      const base64 =
        options?.imageBase64 ?? `data:image/jpeg;base64,${buffer.toString("base64")}`;
      const res = await generateIdPhoto(base64, options?.prompt);
      return { resultUrl: res.images[0], requestId: res.requestId };
    }
    case "remove-background-people": {
      const base64 =
        options?.imageBase64 ?? `data:image/jpeg;base64,${buffer.toString("base64")}`;
      const res = await removeBackgroundPeople(base64);
      return { resultUrl: res.images[0], requestId: res.requestId };
    }
    default:
      throw new Error("UNSUPPORTED_PRODUCT");
  }
}
