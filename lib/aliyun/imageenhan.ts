import { RuntimeOptions } from "@alicloud/tea-util";
import {
  bufferToStream,
  createImageenhanClient,
  ImageenhanModels,
} from "./client";

export async function makeSuperResolution(
  buffer: Buffer,
  upscaleFactor = 2,
): Promise<{ imageUrl: string; requestId?: string }> {
  const client = createImageenhanClient();
  const req = new ImageenhanModels.MakeSuperResolutionImageAdvanceRequest();
  req.urlObject = bufferToStream(buffer);
  req.upscaleFactor = upscaleFactor;
  req.outputFormat = "png";
  const runtime = new RuntimeOptions({});
  const res = await client.makeSuperResolutionImageAdvance(req, runtime);
  const imageUrl = res.body?.data?.url;
  if (!imageUrl) throw new Error("图像超分未返回结果");
  return { imageUrl, requestId: res.body?.requestId };
}
