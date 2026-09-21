import "server-only";

import { extractJsonObject } from "@/lib/agent/extract-json";
import { completeLlm } from "@/lib/agent/llm";
import { getRunRecord } from "@/lib/agent/run-records";

export type ExplainResult = {
  title: string;
  summary: string;
  details: string[];
};

export async function explainRun(input: {
  runId: string;
  stepId?: string;
  riskResult?: boolean;
}): Promise<ExplainResult> {
  const run = await getRunRecord(input.runId);
  if (!run) {
    throw new Error(`没有找到运行 ${input.runId}`);
  }
  const step = input.stepId ? run.steps.find((item) => item.stepId === input.stepId) : undefined;
  const completion = await completeLlm({
    purpose: "explain",
    json: true,
    context: {
      question: run.question,
      step,
      riskResult: input.riskResult || !step ? run.riskResult : undefined,
      status: run.status,
    },
    messages: [
      {
        role: "system",
        content:
          "你是运营审计助手。用中文解释这次运行或风险判断，输出 JSON {title, summary, details: string[]}。",
      },
      {
        role: "user",
        content: JSON.stringify({
          question: run.question,
          status: run.status,
          step,
          riskResult: run.riskResult,
          wantRisk: Boolean(input.riskResult) || !step,
        }),
      },
    ],
  });
  const parsed = extractJsonObject(completion.text) as {
    title?: string;
    summary?: string;
    details?: string[];
  };
  return {
    title: parsed.title || "运行说明",
    summary: parsed.summary || "已生成解释。",
    details: Array.isArray(parsed.details) ? parsed.details.map(String) : [],
  };
}
