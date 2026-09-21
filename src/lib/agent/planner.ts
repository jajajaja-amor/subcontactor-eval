import "server-only";

import { extractJsonObject } from "@/lib/agent/extract-json";
import { describeAvailable } from "@/lib/agent/capabilities";
import { completeLlm } from "@/lib/agent/llm";
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
        content: `你是 SubcontractOps Planner。只能选择当前启用的 Skill 和 Tool。输出 JSON，字段：selectedSkills, selectedTools, reasoning, mandatoryCapabilities, risk{level,flags,requiresHandoff,summary}, degradation?。
规则：
- 必须覆盖 mandatoryCapabilities。
- 报价/价格必须包含 calculate_price。
- 工单/施工任务/采购订单必须包含 query_orders。
- 材料到场/设备进场/物资运输必须包含 query_logistics。
- 资质/安全许可证/保险/特种作业证必须包含 query_qualifications 或 qualification-risk-reminder。
- 风险输入必须包含 risk-check。
- 无法满足时明确 degradation 并转人工。
不要直接给最终客服答案。`,
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
