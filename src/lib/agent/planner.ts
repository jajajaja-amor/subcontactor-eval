import "server-only";

import { extractJsonObject } from "@/lib/agent/extract-json";
import { describeAvailable } from "@/lib/agent/capabilities";
import { completeLlm } from "@/lib/agent/llm";
import { DEFAULT_PLANNER_PROMPT, getPlannerConfig } from "@/lib/planner-config";
import { agentPlanSchema } from "@/lib/schemas";
import type {
  AgentPlan,
  ConversationMessage,
  MandatoryCapability,
  Skill,
  Tool,
} from "@/lib/types";

export type PlannerInput = {
  userInput: string;
  conversationHistory: ConversationMessage[];
  availableSkills: Skill[];
  availableTools: Tool[];
  mandatoryCapabilities: MandatoryCapability[];
  systemPrompt?: string;
};

function fallbackPlan(input: PlannerInput, reason: string): AgentPlan {
  return {
    selectedSkills: input.availableSkills.some((item) => item.id === "human-handoff-decision")
      ? ["human-handoff-decision"]
      : [],
    selectedTools: [],
    reasoning: reason,
    mandatoryCapabilities: input.mandatoryCapabilities,
    risk: {
      level: "高",
      flags: ["plan_parse_fallback"],
      requiresHandoff: true,
      summary: "Plan JSON 无法解析，已安全降级为转人工，页面不会中断。",
    },
    degradation: {
      needed: true,
      reason,
      handoff: true,
    },
    parseFallback: true,
  };
}

export async function createPlan(input: PlannerInput): Promise<AgentPlan> {
  const catalog = describeAvailable(input.availableSkills, input.availableTools);
  const storedPrompt = input.systemPrompt ?? (await getPlannerConfig().catch(() => null))?.prompt;
  const result = await completeLlm({
    purpose: "plan",
    json: true,
    context: {
      userInput: input.userInput,
      conversationHistory: input.conversationHistory,
      availableSkills: catalog.skills,
      availableTools: catalog.tools,
      mandatoryCapabilities: input.mandatoryCapabilities,
    },
    messages: [
      {
        role: "system",
        content: storedPrompt || DEFAULT_PLANNER_PROMPT,
      },
      {
        role: "user",
        content: JSON.stringify({
          userInput: input.userInput,
          conversationHistory: input.conversationHistory,
          availableSkills: catalog.skills,
          availableTools: catalog.tools,
          mandatoryCapabilities: input.mandatoryCapabilities,
        }),
      },
    ],
  });

  try {
    const parsed = agentPlanSchema.parse(extractJsonObject(result.text));
    const allowedSkills = new Set(input.availableSkills.map((item) => item.id));
    const allowedTools = new Set(input.availableTools.map((item) => item.name));
    return {
      ...parsed,
      selectedSkills: parsed.selectedSkills.filter((id) => allowedSkills.has(id)),
      selectedTools: parsed.selectedTools.filter((name) => allowedTools.has(name)),
      mandatoryCapabilities: input.mandatoryCapabilities,
    };
  } catch {
    return fallbackPlan(input, "Planner JSON 解析失败，已安全降级。");
  }
}
