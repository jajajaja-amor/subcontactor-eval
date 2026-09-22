import "server-only";

import { deriveMandatoryCapabilities } from "@/lib/agent/capabilities";
import { createPlan } from "@/lib/agent/planner";
import { validatePlan } from "@/lib/agent/validator";
import {
  filterPlannerCatalog,
  getPlannerConfig,
  mergeCapabilities,
} from "@/lib/planner-config";
import { getEnabledCapabilities } from "@/lib/skill-registry";
import type { MandatoryCapability } from "@/lib/types";

export async function previewPlanner(input: {
  question: string;
  extraCapabilities?: MandatoryCapability[];
}) {
  const question = input.question.trim();
  if (!question) {
    throw new Error("需要测试问题");
  }

  const [config, enabled] = await Promise.all([getPlannerConfig(), getEnabledCapabilities()]);
  const catalog = filterPlannerCatalog(config, enabled.skills, enabled.tools);
  const mandatoryCapabilities = mergeCapabilities(deriveMandatoryCapabilities(question), [
    ...config.extraCapabilities,
    ...(input.extraCapabilities ?? []),
  ]);

  const plan = await createPlan({
    userInput: question,
    conversationHistory: [],
    availableSkills: catalog.skills,
    availableTools: catalog.tools,
    mandatoryCapabilities,
    systemPrompt: config.prompt,
  });
  const validation = validatePlan({
    plan,
    mandatoryCapabilities,
    availableSkills: catalog.skills,
    availableTools: catalog.tools,
  });
  plan.validationIssues = validation.issues;

  return {
    ok: validation.ok && !validation.blocked,
    plan,
    validation,
    catalog: {
      skills: catalog.skills.map((item) => item.id),
      tools: catalog.tools.map((item) => item.name),
    },
    mandatoryCapabilities,
    message: validation.ok
      ? "计划合法。"
      : validation.issues.map((item) => item.message).join("；"),
  };
}
