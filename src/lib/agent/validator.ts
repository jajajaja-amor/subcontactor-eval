import "server-only";

import { capabilityCoverage } from "@/lib/agent/capabilities";
import type { AgentPlan, MandatoryCapability, Skill, Tool, ValidationIssue } from "@/lib/types";

export type PlanValidation = {
  ok: boolean;
  blocked: boolean;
  issues: ValidationIssue[];
};

export function validatePlan(input: {
  plan: AgentPlan;
  mandatoryCapabilities: MandatoryCapability[];
  availableSkills: Skill[];
  availableTools: Tool[];
}): PlanValidation {
  const issues: ValidationIssue[] = [];
  const skillIds = new Set(input.availableSkills.map((item) => item.id));
  const toolNames = new Set(input.availableTools.map((item) => item.name));

  for (const skillId of input.plan.selectedSkills) {
    if (!skillIds.has(skillId)) {
      issues.push({
        code: "unknown_or_disabled_skill",
        message: `禁止调用未启用或不存在的 Skill ${skillId}`,
        severity: "block",
      });
    }
  }
  for (const toolName of input.plan.selectedTools) {
    if (!toolNames.has(toolName)) {
      issues.push({
        code: "unknown_or_disabled_tool",
        message: `禁止调用未启用或不存在的 Tool ${toolName}`,
        severity: "block",
      });
    }
  }

  const planCaps = new Set(input.plan.mandatoryCapabilities);
  for (const cap of input.mandatoryCapabilities) {
    if (!planCaps.has(cap)) {
      issues.push({
        code: "capability_omitted",
        message: `Plan 遗漏 mandatoryCapability ${cap}`,
        severity: "red",
        capability: cap,
      });
    }
    const coverage = capabilityCoverage(cap, input.plan.selectedSkills, input.plan.selectedTools);
    if (coverage.ok) {
      continue;
    }
    if (cap === "price-calculation") {
      issues.push({
        code: "missing_calculate_price",
        message: "报价/价格场景缺少 calculate_price",
        severity: "red",
        capability: cap,
      });
    } else if (cap === "order-query") {
      issues.push({
        code: "missing_query_orders",
        message: "工单/施工任务/采购订单场景缺少 query_orders",
        severity: "red",
        capability: cap,
      });
    } else if (cap === "logistics-query") {
      issues.push({
        code: "missing_query_logistics",
        message: "材料到场/设备进场/物资运输场景缺少 query_logistics",
        severity: "red",
        capability: cap,
      });
    } else if (cap === "qualification-check") {
      issues.push({
        code: "missing_query_qualifications",
        message: "资质/安全许可证/保险/特种作业证场景缺少 query_qualifications，将降级",
        severity: "red",
        capability: cap,
      });
    } else if (cap === "risk-check") {
      issues.push({
        code: "missing_risk_check",
        message: "风险场景缺少 risk-check，阻断自动成功回复",
        severity: "block",
        capability: cap,
      });
    } else {
      issues.push({
        code: "capability_unmapped",
        message: `mandatoryCapability ${cap} 未映射到启用的 Skill/Tool`,
        severity: "red",
        capability: cap,
      });
    }
  }

  const blocked = issues.some((item) => item.severity === "block");
  const ok = issues.length === 0;
  return { ok, blocked, issues };
}
