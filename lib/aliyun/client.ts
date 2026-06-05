import Imageseg from "@alicloud/imageseg20191230";
import Imageenhan from "@alicloud/imageenhan20190930";
import { $OpenApiUtil } from "@alicloud/openapi-core";
import { Readable } from "stream";

export * as ImagesegModels from "@alicloud/imageseg20191230/dist/models/model";
export * as ImageenhanModels from "@alicloud/imageenhan20190930/dist/models/model";

function getAccessKeyConfig() {
  const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
  if (!accessKeyId || !accessKeySecret) {
    throw new Error("ALIBABA_CLOUD_NOT_CONFIGURED");
  }
  return { accessKeyId, accessKeySecret };
}

export function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export function createImagesegClient() {
  const { accessKeyId, accessKeySecret } = getAccessKeyConfig();
  const config = new $OpenApiUtil.Config({
    accessKeyId,
    accessKeySecret,
    endpoint: "imageseg.cn-shanghai.aliyuncs.com",
  });
  return new Imageseg(config);
}

export function createImageenhanClient() {
  const { accessKeyId, accessKeySecret } = getAccessKeyConfig();
  const config = new $OpenApiUtil.Config({
    accessKeyId,
    accessKeySecret,
    endpoint: "imageenhan.cn-shanghai.aliyuncs.com",
  });
  return new Imageenhan(config);
}
