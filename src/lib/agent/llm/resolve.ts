import "server-only";

import { getLlmConfig } from "@/lib/ops-repo";
import type { LlmProviderName } from "@/lib/types";

import { DEMO_SWITCH_HINT, LlmProviderError } from "@/lib/agent/llm/types";

export type ResolvedLlmProvider = {
  name: LlmProviderName;
  model: string;
  temperature: number;
  maxTokens: number;
};

function normalizeProvider(raw: string): LlmProviderName | null {
  const value = raw.trim().toLowerCase();
  if (!value) {
    return null;
  }
  if (["classroom-fixture", "fixture", "demo"].includes(value)) {
    return "classroom-fixture";
  }
  if (value === "coze") {
    return "coze";
  }
  if (["openai-compatible", "openai", "dashscope", "qwen"].includes(value)) {
    return "openai-compatible";
  }
  return null;
}

function missingConfig(provider: string, missing: string[]) {
  return new LlmProviderError({
    code: "missing_config",
    provider,
    message: `当前 LLM Provider 为「${provider}」，缺少配置：${missing.join("、")}。`,
    hint: DEMO_SWITCH_HINT,
  });
}

export async function resolveLlmProvider(): Promise<ResolvedLlmProvider> {
  const config = await getLlmConfig();
  const fromEnv = normalizeProvider(process.env.LLM_PROVIDER ?? "");
  const fromFile = normalizeProvider(config.provider);
  const name = fromEnv ?? fromFile;

  if (!name) {
    throw missingConfig(config.provider || "未设置", [
      "LLM_PROVIDER（coze / openai-compatible / classroom-fixture）",
    ]);
  }

  if (name === "openai-compatible") {
    const missing = [
      !process.env.OPENAI_API_KEY ? "OPENAI_API_KEY" : "",
      !process.env.OPENAI_BASE_URL ? "OPENAI_BASE_URL" : "",
      !process.env.LLM_MODEL && !config.model ? "LLM_MODEL" : "",
    ].filter(Boolean);
    if (missing.length > 0) {
      throw missingConfig("openai-compatible", missing);
    }
  }

  if (name === "coze") {
    const token =
      process.env.COZE_CODING_API_KEY ||
      process.env.COZE_WORKLOAD_IDENTITY_API_KEY ||
      process.env.COZE_API_TOKEN;
    if (!token) {
      throw missingConfig("coze", ["COZE_CODING_API_KEY 或 COZE_WORKLOAD_IDENTITY_API_KEY 或 COZE_API_TOKEN"]);
    }
  }

  return {
    name,
    model:
      name === "classroom-fixture"
        ? "classroom-fixture"
        : process.env.LLM_MODEL || config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  };
}
