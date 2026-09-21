import "server-only";

import type { LlmProviderName } from "@/lib/types";

export class LlmProviderError extends Error {
  code: "missing_config" | "provider_failed";
  provider: string;
  hint: string;

  constructor(input: {
    code: "missing_config" | "provider_failed";
    provider: string;
    message: string;
    hint: string;
  }) {
    super(input.message);
    this.name = "LlmProviderError";
    this.code = input.code;
    this.provider = input.provider;
    this.hint = input.hint;
  }

  toJSON() {
    return {
      ok: false,
      code: this.code,
      provider: this.provider,
      message: this.message,
      hint: this.hint,
    };
  }
}

export const DEMO_SWITCH_HINT =
  "系统不会静默降级成演示模式。若要使用课堂确定性演示，请设置环境变量 LLM_PROVIDER=classroom-fixture 后重试。";

export type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmPurpose = "plan" | "skill" | "reply" | "risk" | "explain" | "eval-score";

export type LlmCompletionRequest = {
  purpose: LlmPurpose;
  messages: LlmMessage[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  context?: Record<string, unknown>;
};

export type LlmCompletionResult = {
  provider: LlmProviderName;
  model: string;
  text: string;
};
