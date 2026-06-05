import { RuntimeOptions } from "@alicloud/tea-util";
import {
  bufferToStream,
  createImagesegClient,
  ImagesegModels as Models,
} from "./client";

async function pollAsyncJob(
  client: ReturnType<typeof createImagesegClient>,
  jobId: string,
  maxAttempts = 30,
  intervalMs = 2000,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const req = new Models.GetAsyncJobResultRequest({ jobId });
    const runtime = new RuntimeOptions({});
    const res = await client.getAsyncJobResultWithOptions(req, runtime);
    const status = res.body?.data?.status;

    if (status === "PROCESS_SUCCESS") {
      const resultStr = res.body?.data?.result;
      if (!resultStr) throw new Error("异步任务无结果");
      const parsed = JSON.parse(resultStr) as { ImageUrl?: string };
      if (!parsed.ImageUrl) throw new Error("异步任务结果无图片 URL");
      return parsed.ImageUrl;
    }
    if (status === "PROCESS_FAILED") {
      throw new Error(res.body?.data?.errorMessage ?? "异步任务处理失败");
    }

    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("异步任务超时，请稍后重试");
}

export async function segmentBody(buffer: Buffer): Promise<{
  imageUrl: string;
  requestId?: string;
}> {
  const client = createImagesegClient();
  const req = new Models.SegmentBodyAdvanceRequest();
  req.imageURLObject = bufferToStream(buffer);
  const runtime = new RuntimeOptions({});
  const res = await client.segmentBodyAdvance(req, runtime);
  const imageUrl = res.body?.data?.imageURL;
  if (!imageUrl) throw new Error("人体分割未返回结果");
  return { imageUrl, requestId: res.body?.requestId };
}

export async function segmentHDBody(buffer: Buffer): Promise<{
  imageUrl: string;
  requestId?: string;
}> {
  const client = createImagesegClient();
  const req = new Models.SegmentHDBodyAdvanceRequest();
  req.imageURLObject = bufferToStream(buffer);
  const runtime = new RuntimeOptions({});
  const res = await client.segmentHDBodyAdvance(req, runtime);
  const imageUrl = res.body?.data?.imageURL;
  if (!imageUrl) throw new Error("高清人体分割未返回结果");
  return { imageUrl, requestId: res.body?.requestId };
}

export async function segmentHDCommon(buffer: Buffer): Promise<{
  imageUrl: string;
  requestId?: string;
}> {
  const client = createImagesegClient();
  const req = new Models.SegmentHDCommonImageAdvanceRequest();
  req.imageUrlObject = bufferToStream(buffer);
  const runtime = new RuntimeOptions({});
  const res = await client.segmentHDCommonImageAdvance(req, runtime);
  const requestId = res.body?.requestId;
  if (!requestId) throw new Error("通用高清分割未返回任务 ID");

  const imageUrl = await pollAsyncJob(client, requestId);
  return { imageUrl, requestId };
}
