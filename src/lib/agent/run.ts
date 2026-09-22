import "server-only";

import { randomUUID } from "node:crypto";

import { extractJsonObject } from "@/lib/agent/extract-json";
import { deriveMandatoryCapabilities } from "@/lib/agent/capabilities";
import { executePlan } from "@/lib/agent/executor";
import { completeLlm, LlmProviderError, resolveLlmProvider } from "@/lib/agent/llm";
import { createPlan } from "@/lib/agent/planner";
import { saveRunRecord } from "@/lib/agent/run-records";
import { validatePlan } from "@/lib/agent/validator";
import {
  filterPlannerCatalog,
  getPlannerConfig,
  mergeCapabilities,
} from "@/lib/planner-config";
import { getRuntimeFallback } from "@/lib/ops-repo";
import { getEnabledCapabilities } from "@/lib/skill-registry";
import type {
  AgentStep,
  ConversationMessage,
  RunRecord,
  RunRecordSource,
} from "@/lib/types";

export type AgentEvent =
  | { type: "plan"; plan: RunRecord["plan"]; validationIssues: NonNullable<RunRecord["plan"]>["validationIssues"] }
  | { type: "step"; step: AgentStep }
  | { type: "reply"; finalReply: string }
  | { type: "risk"; riskResult: RunRecord["riskResult"] }
  | { type: "error"; message: string; hint?: string }
  | { type: "done"; run: RunRecord };

export type RunAgentInput = {
  question: string;
  source: RunRecordSource;
  conversationId?: string;
  conversationHistory?: ConversationMessage[];
  simulateToolError?: string;
  onEvent?: (event: AgentEvent) => void;
};

export async function runAgent(input: RunAgentInput): Promise<RunRecord> {
  const started = Date.now();
  const id = `rr_${randomUUID().slice(0, 10)}`;
  const conversationId = input.conversationId || `conv_${randomUUID().slice(0, 8)}`;
  const emit = (event: AgentEvent) => input.onEvent?.(event);

  const base: RunRecord = {
    id,
    question: input.question,
    source: input.source,
    conversationId,
    createdAt: new Date().toISOString(),
    status: "进行中",
    finalReply: "",
    plan: null,
    steps: [],
    riskResult: null,
    durationMs: 0,
    provider: "classroom-fixture",
    model: "classroom-fixture",
    skillVersions: {},
    toolVersions: {},
  };

  try {
    const fallback = await getRuntimeFallback();
    if (fallback.lastProvider) {
      base.provider = fallback.lastProvider;
      base.model = fallback.lastProvider;
    }
    const resolved = await resolveLlmProvider();
    base.provider = resolved.name;
    base.model = resolved.model;

    const [enabled, plannerConfig] = await Promise.all([
      getEnabledCapabilities(),
      getPlannerConfig(),
    ]);
    const { skills, tools } = filterPlannerCatalog(
      plannerConfig,
      enabled.skills,
      enabled.tools,
    );
    const mandatoryCapabilities = mergeCapabilities(
      deriveMandatoryCapabilities(input.question),
      plannerConfig.extraCapabilities,
    );

    const planStarted = Date.now();
    const plan = await createPlan({
      userInput: input.question,
      conversationHistory: input.conversationHistory ?? [],
      availableSkills: skills,
      availableTools: tools,
      mandatoryCapabilities,
    });
    const validation = validatePlan({
      plan,
      mandatoryCapabilities,
      availableSkills: skills,
      availableTools: tools,
    });
    plan.validationIssues = validation.issues;
    base.plan = plan;
    base.steps.push({
      stepId: `step_${randomUUID().slice(0, 8)}`,
      type: "planner",
      name: "planner",
      input: { mandatoryCapabilities },
      output: plan,
      durationMs: Date.now() - planStarted,
      status: "成功",
    });
    base.steps.push({
      stepId: `step_${randomUUID().slice(0, 8)}`,
      type: "validator",
      name: "plan-validator",
      input: { selectedSkills: plan.selectedSkills, selectedTools: plan.selectedTools },
      output: validation,
      durationMs: 1,
      status: validation.blocked ? "失败" : "成功",
      error: validation.blocked
        ? validation.issues.map((item) => item.message).join("；")
        : undefined,
    });
    emit({ type: "plan", plan, validationIssues: validation.issues });
    emit({ type: "step", step: base.steps[0] });
    emit({ type: "step", step: base.steps[1] });

    base.skillVersions = Object.fromEntries(
      plan.selectedSkills.map((skillId) => {
        const skill = skills.find((item) => item.id === skillId);
        return [skillId, skill?.version ?? "unknown"];
      }),
    );
    base.toolVersions = Object.fromEntries(plan.selectedTools.map((name) => [name, "1.0.0"]));

    if (validation.blocked || (!validation.ok && !plan.degradation?.handoff)) {
      base.status = "失败";
      base.error = validation.issues.map((item) => item.message).join("；");
      base.finalReply = `无法继续伪装成功：${base.error}`;
      base.durationMs = Date.now() - started;
      await saveRunRecord(base);
      emit({ type: "error", message: base.error });
      emit({ type: "done", run: base });
      return base;
    }

    if (!validation.ok && plan.degradation?.handoff) {
      base.status = "已接管";
      base.finalReply = `启用能力不足：${plan.degradation.reason}。已转人工，不会继续伪装成功。`;
      base.durationMs = Date.now() - started;
      await saveRunRecord(base);
      emit({ type: "reply", finalReply: base.finalReply });
      emit({ type: "done", run: base });
      return base;
    }

    const executed = await executePlan({
      question: input.question,
      plan,
      skills,
      tools,
      simulateToolError: input.simulateToolError || process.env.AGENT_SIMULATE_TOOL_ERROR,
      onEvent: (event) => emit(event),
    });
    base.steps.push(...executed.steps);
    base.finalReply = executed.finalReply;
    base.riskResult = executed.riskResult;
    emit({ type: "reply", finalReply: base.finalReply });
    emit({ type: "risk", riskResult: base.riskResult });

    if (executed.failed) {
      base.status = "失败";
      base.error =
        executed.steps.find((item) => item.status === "失败")?.error || "执行失败，已写入 RunRecord";
    } else if (executed.riskResult.requiresHandoff || plan.risk.requiresHandoff || plan.degradation?.handoff) {
      base.status = "已接管";
    } else {
      base.status = "成功";
    }

    base.durationMs = Date.now() - started;
    await saveRunRecord(base);
    emit({ type: "done", run: base });
    return base;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent 运行失败";
    const hint = error instanceof LlmProviderError ? error.hint : undefined;
    const combined = hint ? `${message} ${hint}` : message;
    base.status = "失败";
    base.error = combined;
    base.finalReply = combined;
    base.durationMs = Date.now() - started;
    await saveRunRecord(base).catch(() => undefined);
    emit({ type: "error", message, hint });
    emit({ type: "done", run: base });
    return base;
  }
}

export async function scoreGeneratedReply(input: {
  expected: string;
  finalReply: string;
  status: string;
}): Promise<{ passed: boolean; reason: string }> {
  const completion = await completeLlm({
    purpose: "eval-score",
    json: true,
    context: input,
    messages: [
      {
        role: "system",
        content: "你是评测打分器。先看生成回复，再对照期望，输出 JSON {passed, reason}。禁止在未生成回复时直接写 PASS。",
      },
      { role: "user", content: JSON.stringify(input) },
    ],
  });
  try {
    const parsed = extractJsonObject(completion.text) as { passed?: boolean; reason?: string };
    return {
      passed: Boolean(parsed.passed),
      reason: parsed.reason || "已完成评分",
    };
  } catch {
    return { passed: false, reason: "评分 JSON 解析失败" };
  }
}
