import "server-only";

import type { LlmCompletionRequest, LlmCompletionResult } from "@/lib/agent/llm/types";
import { DEMO_SWITCH_HINT, LlmProviderError } from "@/lib/agent/llm/types";

type CozeInvokeResult = {
  content?: string;
  text?: string;
};

export async function completeCoze(
  request: LlmCompletionRequest,
  options: { model: string; temperature: number },
): Promise<LlmCompletionResult> {
  const token =
    process.env.COZE_CODING_API_KEY ||
    process.env.COZE_WORKLOAD_IDENTITY_API_KEY ||
    process.env.COZE_API_TOKEN;
  if (!token) {
    throw new LlmProviderError({
      code: "missing_config",
      provider: "coze",
      message: "coze Provider 缺少 COZE_CODING_API_KEY 或 COZE_WORKLOAD_IDENTITY_API_KEY。",
      hint: DEMO_SWITCH_HINT,
    });
  }

  try {
    const mod = (await import("coze-coding-dev-sdk")) as {
      LLMClient?: new () => {
        invoke: (
          messages: { role: string; content: string }[],
          config?: { model?: string; temperature?: number },
        ) => Promise<CozeInvokeResult | string>;
      };
    };
    if (!mod.LLMClient) {
      throw new Error("coze-coding-dev-sdk 未导出 LLMClient");
    }
    const client = new mod.LLMClient();
    const result = await client.invoke(request.messages, {
      model: options.model,
      temperature: request.temperature ?? options.temperature,
    });
    const text =
      typeof result === "string"
        ? result
        : (result.content ?? result.text ?? "").trim();
    if (!text) {
      throw new Error("coze 返回空内容");
    }
    return { provider: "coze", model: options.model, text };
  } catch (error) {
    if (error instanceof LlmProviderError) {
      throw error;
    }
    throw new LlmProviderError({
      code: "provider_failed",
      provider: "coze",
      message: error instanceof Error ? error.message : "coze Provider 调用失败。",
      hint: DEMO_SWITCH_HINT,
    });
  }
}
