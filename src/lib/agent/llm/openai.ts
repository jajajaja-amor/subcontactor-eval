import "server-only";

import type { LlmCompletionRequest, LlmCompletionResult } from "@/lib/agent/llm/types";
import { DEMO_SWITCH_HINT, LlmProviderError } from "@/lib/agent/llm/types";

export async function completeOpenAiCompatible(
  request: LlmCompletionRequest,
  options: { model: string; temperature: number; maxTokens: number },
): Promise<LlmCompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "").replace(/\/$/, "");
  if (!apiKey || !baseUrl) {
    throw new LlmProviderError({
      code: "missing_config",
      provider: "openai-compatible",
      message: "openai-compatible 缺少 OPENAI_API_KEY 或 OPENAI_BASE_URL。",
      hint: DEMO_SWITCH_HINT,
    });
  }

  const url = `${baseUrl}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      temperature: request.temperature ?? options.temperature,
      max_tokens: request.maxTokens ?? options.maxTokens,
      messages: request.messages,
      ...(request.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  const payload = (await response.json().catch(() => null)) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  } | null;

  if (!response.ok) {
    throw new LlmProviderError({
      code: "provider_failed",
      provider: "openai-compatible",
      message: payload?.error?.message || `openai-compatible 调用失败（HTTP ${response.status}）。`,
      hint: DEMO_SWITCH_HINT,
    });
  }

  const text = payload?.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) {
    throw new LlmProviderError({
      code: "provider_failed",
      provider: "openai-compatible",
      message: "openai-compatible 返回空内容。",
      hint: DEMO_SWITCH_HINT,
    });
  }

  return { provider: "openai-compatible", model: options.model, text };
}
