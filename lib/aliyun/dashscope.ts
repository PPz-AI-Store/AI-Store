import { fetchLongRunning } from "../fetch";

const DASHSCOPE_API_URL =
  process.env.DASHSCOPE_API_URL ??
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

/** 百炼图像生成整体超时，默认 3 分钟，可通过环境变量调整 */
const DASHSCOPE_TIMEOUT_MS = Number(
  process.env.DASHSCOPE_TIMEOUT_MS ?? 180_000,
);

export const DEFAULT_MODEL =
  process.env.DASHSCOPE_MODEL ?? "qwen-image-2.0-pro";

const ID_PHOTO_PROMPT =
  "将这张照片处理成标准证件照：表情严肃自然、正面免冠、光线均匀、背景纯色（白底或蓝底）、无饰品遮挡、符合证件照规范。";

const REMOVE_PEOPLE_PROMPT =
  "擦除照片中背景里的所有路人，只保留画面主体人物，保持主体人物清晰自然，背景干净连贯，不要改变主体人物。";

type DashScopeResponse = {
  request_id?: string;
  code?: string;
  message?: string;
  output?: {
    choices?: Array<{
      message?: { content?: Array<{ image?: string }> };
    }>;
  };
};

export async function callImageGeneration(params: {
  imageBase64: string;
  prompt: string;
  model?: string;
}): Promise<{ images: string[]; requestId?: string; model: string }> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error("DASHSCOPE_NOT_CONFIGURED");

  const model = params.model ?? DEFAULT_MODEL;

  const response = await fetchLongRunning(
    DASHSCOPE_API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: {
          messages: [
            {
              role: "user",
              content: [
                { image: params.imageBase64 },
                { text: params.prompt },
              ],
            },
          ],
        },
        parameters: {
          n: 1,
          watermark: false,
          negative_prompt: " ",
          prompt_extend: true,
        },
      }),
    },
    { timeoutMs: DASHSCOPE_TIMEOUT_MS, connectTimeoutMs: 30_000 },
  );

  const data = (await response.json()) as DashScopeResponse;
  if (!response.ok) {
    throw new Error(data.message ?? data.code ?? "百炼图像生成失败");
  }

  const items = data.output?.choices?.[0]?.message?.content ?? [];
  const images = items
    .map((item) => item.image)
    .filter((url): url is string => Boolean(url));

  if (images.length === 0) {
    throw new Error("模型未返回图像");
  }

  return { images, requestId: data.request_id, model };
}

export async function generateIdPhoto(
  imageBase64: string,
  customPrompt?: string,
) {
  const extra = customPrompt?.trim();
  const prompt = extra
    ? `${ID_PHOTO_PROMPT} 额外要求：${extra}`
    : ID_PHOTO_PROMPT;
  return callImageGeneration({ imageBase64, prompt });
}

export async function removeBackgroundPeople(imageBase64: string) {
  return callImageGeneration({
    imageBase64,
    prompt: REMOVE_PEOPLE_PROMPT,
  });
}
