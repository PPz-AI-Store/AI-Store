export type ProductId =
  | "body-segment"
  | "hd-body-segment"
  | "hd-common-segment"
  | "super-resolution"
  | "id-photo"
  | "remove-background-people";

export type Product = {
  id: ProductId;
  name: string;
  description: string;
  service: string;
  model: string;
  /** 阿里云单次调用成本（元），来源见 docUrl */
  costCny: number;
  /** 默认 QPS 限制 */
  qps: number;
  docUrl: string;
  icon: string;
  /** 是否需要额外参数（如 prompt） */
  needsPrompt?: boolean;
  promptHint?: string;
};

/**
 * 成本价参考：
 * - 人体分割：0.002 元/次（≤1万次/月档）
 * - 图像超分：0.0016 元/次（16元/万次）
 * - 高清分割类：按平台公示价估算
 * - 百炼图像生成：qwen-image-2.0-pro 0.5 元/张
 */
export const PRODUCTS: Record<ProductId, Product> = {
  "body-segment": {
    id: "body-segment",
    name: "人体分割",
    description: "识别图像中的人体轮廓，与背景分离，返回透明 PNG。",
    service: "阿里云视觉智能开放平台",
    model: "SegmentBody",
    costCny: 0.002,
    qps: 2,
    docUrl:
      "https://help.aliyun.com/zh/viapi/developer-reference/api-q897dp",
    icon: "👤",
  },
  "hd-body-segment": {
    id: "hd-body-segment",
    name: "高清人体分割",
    description: "支持更高分辨率（最大 40MB）的人体精细分割。",
    service: "阿里云视觉智能开放平台",
    model: "SegmentHDBody",
    costCny: 0.008,
    qps: 2,
    docUrl:
      "https://help.aliyun.com/zh/viapi/developer-reference/api-high-definition-human-body-segmentation",
    icon: "🧍",
  },
  "hd-common-segment": {
    id: "hd-common-segment",
    name: "通用高清分割",
    description: "对图像主体进行高清分割，最大支持 10000×10000 像素。",
    service: "阿里云视觉智能开放平台",
    model: "SegmentHDCommonImage",
    costCny: 0.01,
    qps: 2,
    docUrl:
      "https://help.aliyun.com/zh/viapi/developer-reference/api-universal-hd-split",
    icon: "✂️",
  },
  "super-resolution": {
    id: "super-resolution",
    name: "图像超分",
    description: "放大图像分辨率并增强细节，支持 1-4 倍放大。",
    service: "阿里云视觉智能开放平台",
    model: "MakeSuperResolutionImage",
    costCny: 0.0016,
    qps: 2,
    docUrl:
      "https://help.aliyun.com/zh/viapi/developer-reference/api-px24vm",
    icon: "🔍",
  },
  "id-photo": {
    id: "id-photo",
    name: "证件照",
    description:
      "上传一张表情严肃的普通照片，AI 生成标准证件照（白底/蓝底等）。",
    service: "阿里云百炼平台",
    model: "qwen-image-2.0-pro",
    costCny: 0.5,
    qps: 2,
    docUrl:
      "https://help.aliyun.com/zh/model-studio/developer-reference/qwen-image-api",
    icon: "📸",
    needsPrompt: true,
    promptHint: "可选：指定背景颜色，如「白底证件照」「蓝底证件照」",
  },
  "remove-background-people": {
    id: "remove-background-people",
    name: "擦除背景人物",
    description: "景区拍照时擦除背景里的路人，保留主体人物。",
    service: "阿里云百炼平台",
    model: "qwen-image-2.0-pro",
    costCny: 0.5,
    qps: 2,
    docUrl:
      "https://help.aliyun.com/zh/model-studio/developer-reference/qwen-image-api",
    icon: "🚶",
    needsPrompt: false,
  },
};

export const PRODUCT_LIST = Object.values(PRODUCTS);

export function getProduct(id: string): Product | undefined {
  return PRODUCTS[id as ProductId];
}
