import "server-only";

import { completeCoze } from "@/lib/agent/llm/coze";
import { completeClassroomFixture } from "@/lib/agent/llm/fixture";
import { completeOpenAiCompatible } from "@/lib/agent/llm/openai";
import { resolveLlmProvider } from "@/lib/agent/llm/resolve";
import type { LlmCompletionRequest, LlmCompletionResult } from "@/lib/agent/llm/types";

export { LlmProviderError, DEMO_SWITCH_HINT } from "@/lib/agent/llm/types";
export { resolveLlmProvider } from "@/lib/agent/llm/resolve";
export type { LlmCompletionRequest, LlmCompletionResult, LlmMessage } from "@/lib/agent/llm/types";

export async function completeLlm(
  request: LlmCompletionRequest,
): Promise<LlmCompletionResult> {
  const resolved = await resolveLlmProvider();
  if (resolved.name === "classroom-fixture") {
    return completeClassroomFixture(request);
  }
  if (resolved.name === "openai-compatible") {
    return completeOpenAiCompatible(request, resolved);
  }
  return completeCoze(request, resolved);
}
