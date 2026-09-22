import "server-only";

import { completeLlm, resolveLlmProvider } from "@/lib/agent/llm";
import { DEMO_SWITCH_HINT, LlmProviderError } from "@/lib/agent/llm/types";
import { llmConfigSchema, runtimeFallbackSchema } from "@/lib/schemas";
import { getLlmConfig, getRuntimeFallback } from "@/lib/ops-repo";
import { updateJson } from "@/lib/store";
import type { LlmConfig, LlmModelOption, LlmProviderName } from "@/lib/types";

const DEFAULT_MODELS: LlmModelOption[] = [
  {
    id: "classroom-fixture",
    name: "课堂演示",
    provider: "classroom-fixture",
    description: "确定性演示稳定模式，输出带【课堂演示】标识。",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    provider: "openai-compatible",
    description: "OpenAI 兼容接口，需要 OPENAI_API_KEY 与 OPENAI_BASE_URL。",
  },
  {
    id: "qwen-plus",
    name: "Qwen Plus",
    provider: "openai-compatible",
    description: "DashScope / 兼容 OpenAI 的通义模型。",
  },
  {
    id: "coze-default",
    name: "Coze 默认",
    provider: "coze",
    description: "通过 coze-coding-dev-sdk 调用，需要 Coze API Token。",
  },
];

const PROVIDER_DESCRIPTIONS: Record<LlmProviderName, string> = {
  "classroom-fixture": "课堂演示稳定模式。确定性输出，带【课堂演示】标识，不会静默切换到其他 Provider。",
  "openai-compatible": "真实模式。读取 OPENAI_API_KEY / OPENAI_BASE_URL / LLM_MODEL，缺配置不会降级到演示。",
  coze: "真实模式。通过 coze-coding-dev-sdk 调用，缺 Token 不会降级到演示。",
};

function nowIso() {
  return new Date().toISOString();
}

export function normalizeProviderName(raw: string): LlmProviderName | null {
  const value = raw.trim().toLowerCase();
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

function envSet(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function describeEnvStatus() {
  return {
    LLM_PROVIDER: { set: envSet("LLM_PROVIDER") },
    LLM_MODEL: { set: envSet("LLM_MODEL") },
    OPENAI_API_KEY: { set: envSet("OPENAI_API_KEY") },
    OPENAI_BASE_URL: { set: envSet("OPENAI_BASE_URL") },
    COZE_CODING_API_KEY: { set: envSet("COZE_CODING_API_KEY") },
    COZE_WORKLOAD_IDENTITY_API_KEY: { set: envSet("COZE_WORKLOAD_IDENTITY_API_KEY") },
    COZE_API_TOKEN: { set: envSet("COZE_API_TOKEN") },
  };
}

export function missingProviderEnv(provider: LlmProviderName) {
  if (provider === "openai-compatible") {
    return [
      !envSet("OPENAI_API_KEY") ? "OPENAI_API_KEY" : "",
      !envSet("OPENAI_BASE_URL") ? "OPENAI_BASE_URL" : "",
    ].filter(Boolean);
  }
  if (provider === "coze") {
    return envSet("COZE_CODING_API_KEY") ||
      envSet("COZE_WORKLOAD_IDENTITY_API_KEY") ||
      envSet("COZE_API_TOKEN")
      ? []
      : ["COZE_CODING_API_KEY 或 COZE_WORKLOAD_IDENTITY_API_KEY 或 COZE_API_TOKEN"];
  }
  return [];
}

export async function recordRuntimeMode(provider: LlmProviderName) {
  return updateJson("runtime-fallback.json", runtimeFallbackSchema, (current) => ({
    ...current,
    lastProvider: provider,
    lastMode: provider === "classroom-fixture" ? "演示稳定模式" : "真实模式",
    lastSwitchedAt: nowIso(),
    strategy:
      provider === "classroom-fixture"
        ? "课堂演示稳定模式，不静默切换到其他 Provider。"
        : `当前运行模式为 ${provider}，缺配置不会静默降级成演示。`,
    updatedAt: nowIso(),
  }));
}

export async function saveLlmConfig(patch: {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fallbackModel?: string;
  models?: LlmModelOption[];
}): Promise<LlmConfig> {
  const updated = await updateJson("llm-config.json", llmConfigSchema, (current) => {
    const models = patch.models?.length ? patch.models : current.models?.length ? current.models : DEFAULT_MODELS;
    return {
      provider: patch.provider ?? current.provider,
      model: patch.model ?? current.model,
      temperature: patch.temperature ?? current.temperature,
      maxTokens: patch.maxTokens ?? current.maxTokens,
      fallbackModel: patch.fallbackModel ?? current.fallbackModel,
      models,
      updatedAt: nowIso(),
    };
  });
  const provider = normalizeProviderName(updated.provider);
  if (provider) {
    await recordRuntimeMode(provider);
  }
  return updated;
}

export async function switchLlmProvider(input: { provider: string; model?: string }) {
  const provider = normalizeProviderName(input.provider);
  if (!provider) {
    throw new LlmProviderError({
      code: "missing_config",
      provider: input.provider,
      message: `不支持的 Provider「${input.provider}」。可选 coze / openai-compatible / classroom-fixture。`,
      hint: DEMO_SWITCH_HINT,
    });
  }
  const config = await getLlmConfig();
  const models = config.models?.length ? config.models : DEFAULT_MODELS;
  const preferred =
    input.model ||
    models.find((item) => item.provider === provider)?.id ||
    (provider === "classroom-fixture" ? "classroom-fixture" : config.model);
  const saved = await saveLlmConfig({
    provider,
    model: preferred,
    fallbackModel: provider === "classroom-fixture" ? "classroom-fixture" : config.fallbackModel,
    models,
  });
  return { config: saved, missing: missingProviderEnv(provider), hint: DEMO_SWITCH_HINT };
}

export async function getPublicLlmConfig() {
  const [config, fallback] = await Promise.all([getLlmConfig(), getRuntimeFallback()]);
  let resolvedName: LlmProviderName | null = null;
  let resolvedModel = config.model;
  let resolveError: { message: string; hint: string } | null = null;
  try {
    const resolved = await resolveLlmProvider();
    resolvedName = resolved.name;
    resolvedModel = resolved.model;
  } catch (error) {
    if (error instanceof LlmProviderError) {
      resolveError = { message: error.message, hint: error.hint };
    } else {
      resolveError = {
        message: error instanceof Error ? error.message : "Provider 配置不完整",
        hint: DEMO_SWITCH_HINT,
      };
    }
  }

  const provider = (resolvedName ?? normalizeProviderName(config.provider) ?? "classroom-fixture") as LlmProviderName;
  const models = config.models?.length ? config.models : DEFAULT_MODELS;
  return {
    provider,
    providerDescription: PROVIDER_DESCRIPTIONS[provider],
    model: resolvedModel,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    fallbackModel: config.fallbackModel,
    models,
    env: describeEnvStatus(),
    mode: provider === "classroom-fixture" ? "演示稳定模式" : "真实模式",
    demo: provider === "classroom-fixture",
    missing: missingProviderEnv(provider),
    hint: DEMO_SWITCH_HINT,
    resolveError,
    runtime: {
      lastProvider: fallback.lastProvider ?? null,
      lastMode: fallback.lastMode ?? null,
      lastSwitchedAt: fallback.lastSwitchedAt ?? null,
    },
  };
}

export async function testLlmConnection() {
  try {
    const resolved = await resolveLlmProvider();
    const completion = await completeLlm({
      purpose: "plan",
      json: true,
      context: {
        userInput: "连接测试",
        availableSkills: [],
        availableTools: [],
        mandatoryCapabilities: [],
      },
      messages: [
        { role: "system", content: "只输出 JSON {\"ok\":true}。" },
        { role: "user", content: "ping" },
      ],
    });
    return {
      ok: true,
      provider: resolved.name,
      model: resolved.model,
      message:
        resolved.name === "classroom-fixture"
          ? "课堂演示稳定模式连接正常。"
          : `${resolved.name} 连接正常。`,
      sample: completion.text.slice(0, 80),
    };
  } catch (error) {
    if (error instanceof LlmProviderError) {
      return error.toJSON();
    }
    return {
      ok: false,
      code: "provider_failed",
      message: error instanceof Error ? error.message : "连接测试失败",
      hint: DEMO_SWITCH_HINT,
    };
  }
}
