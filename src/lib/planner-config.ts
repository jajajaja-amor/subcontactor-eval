import "server-only";

import { MANDATORY_CAPABILITIES } from "@/lib/agent/capabilities";
import { plannerConfigSchema } from "@/lib/schemas";
import { listSkills, listTools } from "@/lib/ops-repo";
import { readJson, updateJson } from "@/lib/store";
import type { MandatoryCapability, PlannerConfig, Skill, Tool } from "@/lib/types";

export const DEFAULT_PLANNER_PROMPT = `你是 SubcontractOps Planner。只能选择当前启用的 Skill 和 Tool。输出 JSON，字段：selectedSkills, selectedTools, reasoning, mandatoryCapabilities, risk{level,flags,requiresHandoff,summary}, degradation?。
规则：
- 必须覆盖 mandatoryCapabilities。
- 报价/价格必须包含 calculate_price。
- 工单/施工任务/采购订单必须包含 query_orders。
- 材料到场/设备进场/物资运输必须包含 query_logistics。
- 资质/安全许可证/保险/特种作业证必须包含 query_qualifications 或 qualification-risk-reminder。
- 风险输入必须包含 risk-check。
- 无法满足时明确 degradation 并转人工。
不要直接给最终客服答案。`;

function nowIso() {
  return new Date().toISOString();
}

export function getPlannerConfig(): Promise<PlannerConfig> {
  return readJson("planner-config.json", plannerConfigSchema);
}

export async function savePlannerConfig(
  patch: Partial<Pick<PlannerConfig, "version" | "prompt" | "allowedSkillIds" | "allowedToolNames" | "extraCapabilities">>,
): Promise<PlannerConfig> {
  return updateJson("planner-config.json", plannerConfigSchema, (current) => ({
    version: patch.version?.trim() || current.version,
    prompt: patch.prompt ?? current.prompt,
    allowedSkillIds: patch.allowedSkillIds ?? current.allowedSkillIds,
    allowedToolNames: patch.allowedToolNames ?? current.allowedToolNames,
    extraCapabilities: (patch.extraCapabilities ?? current.extraCapabilities).filter((item) =>
      MANDATORY_CAPABILITIES.includes(item),
    ),
    updatedAt: nowIso(),
  }));
}

export function filterPlannerCatalog(
  config: PlannerConfig,
  skills: Skill[],
  tools: Tool[],
) {
  const skillAllow = new Set(config.allowedSkillIds);
  const toolAllow = new Set(config.allowedToolNames);
  const nextSkills =
    skillAllow.size === 0 ? skills : skills.filter((item) => skillAllow.has(item.id));
  const nextTools =
    toolAllow.size === 0 ? tools : tools.filter((item) => toolAllow.has(item.name));
  return { skills: nextSkills, tools: nextTools };
}

export function mergeCapabilities(
  derived: MandatoryCapability[],
  extra: MandatoryCapability[],
): MandatoryCapability[] {
  const selected = new Set([...derived, ...extra]);
  return MANDATORY_CAPABILITIES.filter((item) => selected.has(item));
}

export async function listPlannerOptions() {
  const [skills, tools] = await Promise.all([listSkills(), listTools()]);
  return {
    skills: skills.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      enabled: item.enabled,
    })),
    tools: tools.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      enabled: item.enabled,
    })),
    capabilities: MANDATORY_CAPABILITIES,
  };
}
