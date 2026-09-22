import "server-only";

import type { MandatoryCapability, Skill, Tool } from "@/lib/types";

export const MANDATORY_CAPABILITIES: MandatoryCapability[] = [
  "subcontractor-matching",
  "matching-reason",
  "quote-reasoning",
  "price-calculation",
  "order-query",
  "logistics-query",
  "qualification-check",
  "risk-check",
  "human-handoff",
];

export type CapabilityRequirement = {
  skills?: string[];
  skillsAny?: string[];
  tools?: string[];
  toolsAny?: string[];
};

export const CAPABILITY_REQUIREMENTS: Record<MandatoryCapability, CapabilityRequirement> = {
  "subcontractor-matching": {
    skills: ["subcontractor-matching"],
    tools: ["query_subcontractors"],
  },
  "matching-reason": {
    skills: ["subcontractor-matching"],
  },
  "quote-reasoning": {
    skills: ["quote-reasoning"],
  },
  "price-calculation": {
    tools: ["calculate_price"],
  },
  "order-query": {
    tools: ["query_orders"],
  },
  "logistics-query": {
    tools: ["query_logistics"],
  },
  "qualification-check": {
    toolsAny: ["query_qualifications"],
    skillsAny: ["qualification-risk-reminder"],
  },
  "risk-check": {
    skills: ["risk-check"],
  },
  "human-handoff": {
    skills: ["human-handoff-decision"],
  },
};

export function deriveMandatoryCapabilities(input: string): MandatoryCapability[] {
  const text = input.trim();
  const selected = new Set<MandatoryCapability>();

  if (/保证金|介绍费|转账|验证码|诈骗|个人卡|兑付|冒充项目/.test(text)) {
    selected.add("risk-check");
    selected.add("human-handoff");
  }
  if (
    /推荐|匹配|哪家能做|谁能做|找.*队|有哪些.*分包|可合作.*分包|分包商.*有哪些|班组.*(?:推荐|匹配|有哪些)/.test(
      text,
    )
  ) {
    selected.add("subcontractor-matching");
    selected.add("matching-reason");
  }
  if (
    /报价|单价|合价|计价|多少钱|价格|什么价|啥价|询价|估价/.test(text) &&
    !selected.has("risk-check")
  ) {
    selected.add("quote-reasoning");
    selected.add("price-calculation");
  }
  if (/工单|施工任务|采购订单|WO-|任务进度|增援|档期|排班|增加\s*\d+\s*人/.test(text)) {
    selected.add("order-query");
  }
  if (
    /材料到场|设备进场|物资运输|物流|在途|卸货|发运|进场车|钢筋车|到哪了|车辆位置/.test(
      text,
    )
  ) {
    selected.add("logistics-query");
  }
  if (/资质|安全许可证|安全生产许可证|保险|特种作业证|是否过期|是否有效/.test(text)) {
    selected.add("qualification-check");
  }
  if (/转人工|人工接管/.test(text)) {
    selected.add("human-handoff");
  }

  return MANDATORY_CAPABILITIES.filter((item) => selected.has(item));
}

export function capabilityCoverage(
  capability: MandatoryCapability,
  selectedSkills: string[],
  selectedTools: string[],
) {
  const requirement = CAPABILITY_REQUIREMENTS[capability];
  const missingSkills = (requirement.skills ?? []).filter((id) => !selectedSkills.includes(id));
  const missingTools = (requirement.tools ?? []).filter((name) => !selectedTools.includes(name));
  const skillsAnyOk =
    !requirement.skillsAny ||
    requirement.skillsAny.length === 0 ||
    requirement.skillsAny.some((id) => selectedSkills.includes(id));
  const toolsAnyOk =
    !requirement.toolsAny ||
    requirement.toolsAny.length === 0 ||
    requirement.toolsAny.some((name) => selectedTools.includes(name));
  const ok =
    missingSkills.length === 0 && missingTools.length === 0 && (skillsAnyOk || toolsAnyOk);
  return { ok, missingSkills, missingTools, skillsAnyOk, toolsAnyOk };
}

export function describeAvailable(skills: Skill[], tools: Tool[]) {
  return {
    skills: skills.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      requiredTools: item.requiredTools,
    })),
    tools: tools.map((item) => ({
      name: item.name,
      description: item.description,
    })),
  };
}
