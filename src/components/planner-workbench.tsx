"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AdminError, AdminLoading, AdminSuccess } from "@/components/admin-state";
import { CapabilityBadges, ValidationList } from "@/components/agent-trace";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AgentPlan, MandatoryCapability, PlannerConfig, ValidationIssue } from "@/lib/types";

type CatalogItem = { id: string; name: string; description: string; enabled: boolean };
type ToolItem = { id: string; name: string; description: string; enabled: boolean };

const ALL_CAPS: MandatoryCapability[] = [
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

export function PlannerWorkbench({
  initialConfig,
  initialSkills,
  initialTools,
}: {
  initialConfig: PlannerConfig;
  initialSkills: CatalogItem[];
  initialTools: ToolItem[];
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [config, setConfig] = useState<PlannerConfig>(initialConfig);
  const [skills] = useState(initialSkills);
  const [tools] = useState(initialTools);
  const [question, setQuestion] = useState("临港 12# 砌筑有哪些可合作分包商？请说明匹配理由。");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [previewMessage, setPreviewMessage] = useState("");

  function toggleSkill(id: string) {
    if (!config) {
      return;
    }
    const next = config.allowedSkillIds.includes(id)
      ? config.allowedSkillIds.filter((item) => item !== id)
      : [...config.allowedSkillIds, id];
    setConfig({ ...config, allowedSkillIds: next });
  }

  function toggleTool(name: string) {
    if (!config) {
      return;
    }
    const next = config.allowedToolNames.includes(name)
      ? config.allowedToolNames.filter((item) => item !== name)
      : [...config.allowedToolNames, name];
    setConfig({ ...config, allowedToolNames: next });
  }

  function toggleCap(cap: MandatoryCapability) {
    if (!config) {
      return;
    }
    const next = config.extraCapabilities.includes(cap)
      ? config.extraCapabilities.filter((item) => item !== cap)
      : [...config.extraCapabilities, cap];
    setConfig({ ...config, extraCapabilities: next });
  }

  async function save() {
    if (!config) {
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/planner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: config.version,
          prompt: config.prompt,
          allowedSkillIds: config.allowedSkillIds,
          allowedToolNames: config.allowedToolNames,
          extraCapabilities: config.extraCapabilities,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string; config?: PlannerConfig };
      if (!response.ok || !payload.ok || !payload.config) {
        throw new Error(payload.message ?? "保存失败");
      }
      setConfig(payload.config);
      setSuccess("Planner 配置已写入 planner-config.json。");
      toast.success("Planner 已保存");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "保存失败";
      setError(message);
      toast.error("保存失败", { description: message });
    } finally {
      setSaving(false);
    }
  }

  async function preview() {
    setPreviewing(true);
    setPreviewMessage("");
    setPlan(null);
    setIssues([]);
    try {
      const response = await fetch("/api/planner/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        plan?: AgentPlan;
        validation?: { issues?: ValidationIssue[] };
      };
      setPlan(payload.plan ?? null);
      setIssues(payload.validation?.issues ?? payload.plan?.validationIssues ?? []);
      setPreviewMessage(payload.message ?? (payload.ok ? "计划合法。" : "计划非法。"));
      if (!payload.ok) {
        toast.error("计划非法", { description: payload.message });
      }
    } catch (caught) {
      setPreviewMessage(caught instanceof Error ? caught.message : "预览失败");
    } finally {
      setPreviewing(false);
    }
  }

  return (
    <div className="space-y-5">
      {error ? <AdminError message={error} /> : null}
      {success ? <AdminSuccess message={success} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Planner 版本与 Prompt</CardTitle>
            <CardDescription>当前版本 {config.version}，保存走 PUT /api/planner。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">版本</span>
              <Input
                value={config.version}
                onChange={(event) => setConfig({ ...config, version: event.target.value })}
              />
            </label>
            <Textarea
              value={config.prompt}
              onChange={(event) => setConfig({ ...config, prompt: event.target.value })}
              className="min-h-56 font-mono text-xs"
            />
            <Button type="button" disabled={saving} onClick={() => void save()}>
              {saving ? "正在保存" : "保存 Planner 配置"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>mandatoryCapabilities</CardTitle>
            <CardDescription>额外强制能力会并入预览和后续 Run。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {ALL_CAPS.map((cap) => (
              <Button
                key={cap}
                type="button"
                size="sm"
                variant={config.extraCapabilities.includes(cap) ? "default" : "outline"}
                onClick={() => toggleCap(cap)}
              >
                {cap}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>可选 Skill</CardTitle>
            <CardDescription>取消勾选后，预览和主链路都不会再把它当作可用能力。</CardDescription>
          </CardHeader>
          <CardContent className="grid max-h-80 gap-2 overflow-auto text-sm">
            {skills.map((skill) => (
              <label key={skill.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={config.allowedSkillIds.includes(skill.id)}
                  onChange={() => toggleSkill(skill.id)}
                />
                <span className="min-w-0">
                  <span className="font-medium">{skill.name}</span>
                  <span className="block text-xs break-words text-muted-foreground">
                    {skill.id} · {skill.enabled ? "注册启用" : "注册停用"} · {skill.description}
                  </span>
                </span>
              </label>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>可选 Tool</CardTitle>
            <CardDescription>与 Skill 一样，保存后影响预览结果。</CardDescription>
          </CardHeader>
          <CardContent className="grid max-h-80 gap-2 overflow-auto text-sm">
            {tools.map((tool) => (
              <label key={tool.id} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={config.allowedToolNames.includes(tool.name)}
                  onChange={() => toggleTool(tool.name)}
                />
                <span className="min-w-0">
                  <span className="font-medium">{tool.name}</span>
                  <span className="block text-xs break-words text-muted-foreground">
                    {tool.enabled ? "注册启用" : "注册停用"} · {tool.description}
                  </span>
                </span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>预览计划</CardTitle>
          <CardDescription>POST /api/planner/preview。非法计划会返回结构化中文原因。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            className="min-h-24"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={previewing} onClick={() => void preview()}>
              {previewing ? "正在预览" : "预览计划"}
            </Button>
            <Button type="button" variant="outline" disabled={saving} onClick={() => void save()}>
              先保存再预览
            </Button>
          </div>
          {previewing ? <AdminLoading label="正在生成计划" /> : null}
          {previewMessage ? (
            plan && issues.length === 0 ? (
              <AdminSuccess message={previewMessage} />
            ) : (
              <AdminError message={previewMessage} />
            )
          ) : null}
          {plan ? (
            <div className="space-y-2 text-sm">
              <CapabilityBadges items={plan.mandatoryCapabilities} />
              <p className="break-words">selectedSkills：{plan.selectedSkills.join("、") || "无"}</p>
              <p className="break-words">selectedTools：{plan.selectedTools.join("、") || "无"}</p>
              <p className="break-words text-muted-foreground">{plan.reasoning}</p>
              <ValidationList issues={issues} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
