"use client";

import Link from "next/link";

import { StatusBadge, statusTone } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AgentPlan, AgentStep, RiskResult, ValidationIssue } from "@/lib/types";

export function CapabilityBadges({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">无强制能力标签</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
    </div>
  );
}

export function ValidationList({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return <p className="text-sm text-muted-foreground">Plan Validator 未发现问题。</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {issues.map((issue) => (
        <li
          key={`${issue.code}-${issue.message}`}
          className={
            issue.severity === "block" || issue.severity === "red"
              ? "text-destructive"
              : "text-muted-foreground"
          }
        >
          [{issue.severity === "red" ? "标红" : issue.severity}] {issue.message}
        </li>
      ))}
    </ul>
  );
}

export function PlanCard({ plan }: { plan: AgentPlan | null }) {
  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>计划</CardTitle>
          <CardDescription>等待 Planner 输出结构化 JSON。</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>计划</CardTitle>
        <CardDescription>{plan.reasoning}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="mb-1 text-muted-foreground">mandatoryCapabilities</p>
          <CapabilityBadges items={plan.mandatoryCapabilities} />
        </div>
        <p>selectedSkills：{plan.selectedSkills.join("、") || "无"}</p>
        <p>selectedTools：{plan.selectedTools.join("、") || "无"}</p>
        <p>
          风险：{plan.risk.level} {plan.risk.requiresHandoff ? "· 需转人工" : ""} · {plan.risk.summary}
        </p>
        {plan.degradation?.needed ? (
          <p className="text-destructive">降级：{plan.degradation.reason}</p>
        ) : null}
        <ValidationList issues={plan.validationIssues ?? []} />
      </CardContent>
    </Card>
  );
}

export function StepsTable({ steps }: { steps: AgentStep[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>步骤 Trace</CardTitle>
        <CardDescription>每一步包含输入、输出、耗时和错误，Tool 失败不会伪装成成功。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">尚未执行。</p>
        ) : (
          steps.map((step) => (
            <div key={step.stepId} className="rounded-lg border border-border px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{step.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {step.type} · {step.stepId} · {step.durationMs}ms
                  </span>
                </div>
                <StatusBadge label={step.status} tone={statusTone(step.status)} />
              </div>
              {step.error ? <p className="mt-1 text-destructive">{step.error}</p> : null}
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                {JSON.stringify({ input: step.input, output: step.output }, null, 2)}
              </pre>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function ReplyCard({
  reply,
  risk,
  runId,
}: {
  reply: string;
  risk: RiskResult | null;
  runId?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最终回复</CardTitle>
        <CardDescription>
          {risk
            ? `风险 ${risk.level} · ${risk.blocked ? "已阻断" : "已放行"} · ${risk.requiresHandoff ? "转人工" : "可发送"}`
            : "等待 risk-check"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="whitespace-pre-wrap">{reply || "暂无回复"}</p>
        {risk ? (
          <ul className="list-disc pl-5 text-muted-foreground">
            {risk.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        {runId ? (
          <p>
            <Link className="text-primary underline-offset-4 hover:underline" href={`/runs/${runId}`}>
              打开运行详情 {runId}
            </Link>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
