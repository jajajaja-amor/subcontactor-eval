import "server-only";

import { randomUUID } from "node:crypto";

import { extractJsonObject } from "@/lib/agent/extract-json";
import { completeLlm } from "@/lib/agent/llm";
import { buildToolArgs } from "@/lib/agent/tool-args";
import { getToolsConfig } from "@/lib/ops-repo";
import { riskResultSchema } from "@/lib/schemas";
import { runRegisteredTool } from "@/lib/tool-runner";
import type {
  AgentPlan,
  AgentStep,
  RiskResult,
  RunStepStatus,
  Skill,
  Tool,
} from "@/lib/types";

export type ExecutorEvent = {
  type: "step";
  step: AgentStep;
};

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} 超时（${ms}ms）`)), ms);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function nowMs() {
  return Date.now();
}

export async function executePlan(input: {
  question: string;
  plan: AgentPlan;
  skills: Skill[];
  tools: Tool[];
  simulateToolError?: string;
  onEvent?: (event: ExecutorEvent) => void;
}): Promise<{
  steps: AgentStep[];
  finalReply: string;
  riskResult: RiskResult;
  toolResults: Record<string, unknown>;
  failed: boolean;
}> {
  const config = await getToolsConfig();
  const skillTimeout = Number(process.env.AGENT_SKILL_TIMEOUT_MS ?? 20000);
  const steps: AgentStep[] = [];
  const toolResults: Record<string, unknown> = {};
  const skillNotes: Record<string, string> = {};
  let failed = false;

  const emit = (step: AgentStep) => {
    steps.push(step);
    input.onEvent?.({ type: "step", step });
  };

  const runStep = async (
    type: AgentStep["type"],
    name: string,
    stepInput: unknown,
    fn: () => Promise<unknown>,
  ): Promise<{ status: RunStepStatus; output: unknown; error?: string }> => {
    const started = nowMs();
    const stepId = `step_${randomUUID().slice(0, 8)}`;
    try {
      const output = await fn();
      const step: AgentStep = {
        stepId,
        type,
        name,
        input: stepInput,
        output,
        durationMs: nowMs() - started,
        status: "成功",
      };
      emit(step);
      return { status: "成功", output };
    } catch (error) {
      const message = error instanceof Error ? error.message : "步骤失败";
      const step: AgentStep = {
        stepId,
        type,
        name,
        input: stepInput,
        output: null,
        durationMs: nowMs() - started,
        status: "失败",
        error: message,
      };
      emit(step);
      failed = true;
      return { status: "失败", output: null, error: message };
    }
  };

  for (const toolName of input.plan.selectedTools) {
    const args = buildToolArgs(toolName, input.question);
    const result = await runStep("tool", toolName, args, async () => {
      if (input.simulateToolError && input.simulateToolError === toolName) {
        throw new Error(`模拟 Tool 失败：${toolName}`);
      }
      const executed = await withTimeout(
        runRegisteredTool(toolName, args),
        config.timeoutMs,
        `Tool ${toolName}`,
      );
      if (!executed.ok) {
        throw new Error(executed.error || `${toolName} 执行失败`);
      }
      return executed.data ?? null;
    });
    if (result.status === "成功") {
      toolResults[toolName] = result.output;
    }
  }

  const generateSkills = input.plan.selectedSkills.filter(
    (id) => id !== "response-generator" && id !== "risk-check",
  );
  for (const skillId of generateSkills) {
    const skill = input.skills.find((item) => item.id === skillId);
    const prompt = skill ? await Promise.resolve((skill as Skill & { systemPrompt?: string }).systemPrompt ?? "") : "";
    const result = await runStep("skill", skillId, { question: input.question }, async () => {
      const completion = await withTimeout(
        completeLlm({
          purpose: "skill",
          context: { skillId, userInput: input.question, toolResults },
          messages: [
            { role: "system", content: prompt || `你是 Skill ${skillId}` },
            {
              role: "user",
              content: JSON.stringify({ question: input.question, toolResults }),
            },
          ],
        }),
        skillTimeout,
        `Skill ${skillId}`,
      );
      return completion.text;
    });
    if (result.status === "成功") {
      skillNotes[skillId] = String(result.output);
    }
  }

  const replySkill = input.skills.find((item) => item.id === "response-generator");
  const replyResult = await runStep("reply", "response-generator", { question: input.question }, async () => {
    const completion = await withTimeout(
      completeLlm({
        purpose: "reply",
        context: {
          userInput: input.question,
          toolResults,
          skillNotes,
          plan: input.plan,
        },
        messages: [
          {
            role: "system",
            content:
              (replySkill as Skill & { systemPrompt?: string } | undefined)?.systemPrompt ||
              "把工具结果写成中文客服回复，先结论后依据，不编造合同条款。",
          },
          {
            role: "user",
            content: JSON.stringify({
              question: input.question,
              toolResults,
              skillNotes,
            }),
          },
        ],
      }),
      skillTimeout,
      "Skill response-generator",
    );
    return completion.text;
  });

  let finalReply = replyResult.status === "成功" ? String(replyResult.output) : "";
  if (!finalReply) {
    finalReply = "本轮未能生成完整回复。";
    failed = true;
  }

  const riskSkill = input.skills.find((item) => item.id === "risk-check");
  let riskResult: RiskResult = {
    blocked: false,
    requiresHandoff: false,
    level: "低",
    reasons: ["未执行 risk-check"],
    passed: false,
  };

  if (riskSkill) {
    const riskStep = await runStep(
      "risk-check",
      "risk-check",
      { question: input.question, candidateReply: finalReply },
      async () => {
        const completion = await withTimeout(
          completeLlm({
            purpose: "risk",
            json: true,
            context: {
              userInput: input.question,
              candidateReply: finalReply,
              toolResults,
            },
            messages: [
              {
                role: "system",
                content:
                  (riskSkill as Skill & { systemPrompt?: string }).systemPrompt ||
                  "审计回复是否危险，输出 JSON。",
              },
              {
                role: "user",
                content: JSON.stringify({
                  question: input.question,
                  candidateReply: finalReply,
                  toolResults,
                }),
              },
            ],
          }),
          skillTimeout,
          "Skill risk-check",
        );
        return riskResultSchema.parse(extractJsonObject(completion.text));
      },
    );
    if (riskStep.status === "成功") {
      riskResult = riskStep.output as RiskResult;
      if (riskResult.blocked && riskResult.rewrittenReply) {
        finalReply = riskResult.rewrittenReply;
      }
    } else {
      failed = true;
    }
  } else if (input.plan.mandatoryCapabilities.includes("risk-check")) {
    failed = true;
    emit({
      stepId: `step_${randomUUID().slice(0, 8)}`,
      type: "risk-check",
      name: "risk-check",
      input: { question: input.question },
      output: null,
      durationMs: 0,
      status: "失败",
      error: "risk-check 未启用，不能伪装成功",
    });
  }

  return { steps, finalReply, riskResult, toolResults, failed };
}
