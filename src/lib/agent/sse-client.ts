"use client";

import type { AgentPlan, AgentStep, RiskResult, RunRecord, ValidationIssue } from "@/lib/types";

export type AgentStreamEvent =
  | { type: "plan"; plan: AgentPlan | null; validationIssues?: ValidationIssue[] }
  | { type: "step"; step: AgentStep }
  | { type: "reply"; finalReply: string }
  | { type: "risk"; riskResult: RiskResult | null }
  | { type: "error"; message: string; hint?: string }
  | { type: "done"; run: RunRecord };

export async function streamAgentRun(
  body: {
    question: string;
    source: "web" | "demo" | "api";
    conversationId?: string;
    simulateToolError?: string;
  },
  onEvent: (event: AgentStreamEvent) => void,
): Promise<RunRecord | null> {
  const response = await fetch("/api/agent/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      hint?: string;
    } | null;
    throw new Error(payload?.hint ? `${payload.message} ${payload.hint}` : payload?.message || "运行失败");
  }

  if (!response.body) {
    throw new Error("浏览器未收到流式响应");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastError: string | undefined;
  let doneRun: RunRecord | null = null;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";
    for (const chunk of chunks) {
      const eventLine = chunk.split("\n").find((line) => line.startsWith("event:"));
      const dataLine = chunk.split("\n").find((line) => line.startsWith("data:"));
      if (!eventLine || !dataLine) {
        continue;
      }
      const type = eventLine.slice(6).trim();
      const payload = JSON.parse(dataLine.slice(5).trim()) as Record<string, unknown>;
      const event = { ...payload, type } as AgentStreamEvent;
      onEvent(event);
      if (event.type === "done") {
        doneRun = event.run;
      }
      if (event.type === "error" && event.message) {
        lastError = event.hint ? `${event.message} ${event.hint}` : event.message;
      }
    }
  }

  if (!doneRun && lastError) {
    throw new Error(lastError);
  }

  return doneRun;
}
