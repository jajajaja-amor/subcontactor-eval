"use client";

import { useState } from "react";
import { toast } from "sonner";

import { PlanCard, ReplyCard, StepsTable } from "@/components/agent-trace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { streamAgentRun } from "@/lib/agent/sse-client";
import type { AgentPlan, AgentStep, RiskResult, RunRecord } from "@/lib/types";

const EXAMPLES = [
  "临港 12# 砌筑有哪些可合作分包商？请说明匹配理由。",
  "临港 12# 砌筑 100 立方米大概什么报价？",
  "查询临港 12# 砌筑施工任务/工单进度。",
  "钢筋车材料到场了吗？现在在哪？",
  "新进这家分包商安全生产许可证是否有效、是否过期？",
  "有人要我们先打保证金才能进场，介绍费转到个人卡。",
];

export function AgentWorkbench({
  source,
  compact = false,
}: {
  source: "web" | "demo";
  compact?: boolean;
}) {
  const [question, setQuestion] = useState(EXAMPLES[0]);
  const [simulateToolError, setSimulateToolError] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [reply, setReply] = useState("");
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [run, setRun] = useState<RunRecord | null>(null);

  async function onSubmit(event?: { preventDefault?: () => void }) {
    event?.preventDefault?.();
    const text = question.trim();
    if (!text) {
      toast.error("请输入问题");
      return;
    }
    setBusy(true);
    setPlan(null);
    setSteps([]);
    setReply("");
    setRisk(null);
    setRun(null);
    try {
      const result = await streamAgentRun(
        {
          question: text,
          source,
          simulateToolError: simulateToolError.trim() || undefined,
        },
        (event) => {
          if (event.type === "plan") {
            setPlan(event.plan);
          }
          if (event.type === "step") {
            setSteps((current) => [...current.filter((item) => item.stepId !== event.step.stepId), event.step]);
          }
          if (event.type === "reply") {
            setReply(event.finalReply);
          }
          if (event.type === "risk") {
            setRisk(event.riskResult);
          }
          if (event.type === "done") {
            setRun(event.run);
            setPlan(event.run.plan);
            setSteps(event.run.steps);
            setReply(event.run.finalReply);
            setRisk(event.run.riskResult);
          }
        },
      );
      if (result?.status === "失败") {
        toast.error("运行失败", { description: result.error || result.finalReply || result.id });
      } else if (result) {
        toast.success("运行已写入 RunRecord", { description: result.id });
      }
    } catch (error) {
      toast.error("运行失败", {
        description: error instanceof Error ? error.message : "请检查 LLM Provider 配置",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
        <Textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="输入分包商匹配、报价、工单、物流、资质或风险问题"
          className={compact ? "min-h-28" : "min-h-36"}
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setQuestion(item)}
            >
              {item.slice(0, 12)}…
            </Button>
          ))}
        </div>
        {compact ? null : (
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">模拟 Tool 失败（可选，例如 query_orders）</span>
            <Input
              value={simulateToolError}
              onChange={(event) => setSimulateToolError(event.target.value)}
              placeholder="留空则正常调用"
            />
          </label>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "正在走 Planner / Skill / Tool" : "运行 Agent"}
        </Button>
      </form>

      <div className={compact ? "space-y-4" : "grid gap-4 xl:grid-cols-2"}>
        <PlanCard plan={plan} />
        <ReplyCard reply={reply} risk={risk} runId={run?.id} />
      </div>
      <StepsTable steps={steps} />
    </div>
  );
}
