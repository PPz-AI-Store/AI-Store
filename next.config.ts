import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@alicloud/imageseg20191230",
    "@alicloud/imageenhan20190930",
    "alipay-sdk",
  ],
};

export default nextConfig;
