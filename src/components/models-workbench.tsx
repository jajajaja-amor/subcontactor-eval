"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AdminError, AdminSuccess } from "@/components/admin-state";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LlmModelOption, LlmProviderName } from "@/lib/types";

type EnvFlag = { set: boolean };
type PublicLlmConfig = {
  provider: LlmProviderName;
  providerDescription: string;
  model: string;
  temperature: number;
  maxTokens: number;
  fallbackModel: string;
  models: LlmModelOption[];
  env: Record<string, EnvFlag>;
  mode: string;
  demo: boolean;
  missing: string[];
  hint: string;
  resolveError: { message: string; hint: string } | null;
  runtime: { lastProvider: string | null; lastMode: string | null; lastSwitchedAt: string | null };
};

const PROVIDERS: LlmProviderName[] = ["classroom-fixture", "openai-compatible", "coze"];

export function ModelsWorkbench({ initial }: { initial: PublicLlmConfig }) {
  const [error, setError] = useState(initial.resolveError ? `${initial.resolveError.message} ${initial.resolveError.hint}` : "");
  const [success, setSuccess] = useState("");
  const [config, setConfig] = useState<PublicLlmConfig>(initial);
  const [model, setModel] = useState(initial.model);
  const [temperature, setTemperature] = useState(String(initial.temperature));
  const [maxTokens, setMaxTokens] = useState(String(initial.maxTokens));
  const [busy, setBusy] = useState(false);
  const [testMessage, setTestMessage] = useState("");
  const [testOk, setTestOk] = useState<boolean | null>(null);

  function apply(next: PublicLlmConfig) {
    setConfig(next);
    setModel(next.model);
    setTemperature(String(next.temperature));
    setMaxTokens(String(next.maxTokens));
  }

  async function save() {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/llm-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          temperature: Number(temperature),
          maxTokens: Number(maxTokens),
        }),
      });
      const payload = (await response.json()) as PublicLlmConfig & { ok?: boolean; message?: string };
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.message ?? "保存失败");
      }
      apply(payload);
      setSuccess("LLM 配置已写入 llm-config.json，并记录到 runtime-fallback.json。");
      toast.success("已保存");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "保存失败";
      setError(message);
      toast.error("保存失败", { description: message });
    } finally {
      setBusy(false);
    }
  }

  async function switchProvider(provider: LlmProviderName) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/llm-config/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const payload = (await response.json()) as PublicLlmConfig & {
        ok?: boolean;
        message?: string;
        hint?: string;
      };
      if (!response.ok && payload.message) {
        throw new Error(`${payload.message}${payload.hint ? ` ${payload.hint}` : ""}`);
      }
      apply(payload);
      if (payload.missing?.length) {
        setError(
          `已切换到 ${provider}，但缺少 ${payload.missing.join("、")}。系统不会静默降级。${payload.hint ?? ""}`,
        );
      } else {
        setSuccess(`已切换到 ${provider}，后续 RunRecord 将使用该 Provider。`);
      }
      toast.success(`已切换 ${provider}`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "切换失败";
      setError(message);
      toast.error("切换失败", { description: message });
    } finally {
      setBusy(false);
    }
  }

  async function testConnection() {
    setBusy(true);
    setTestMessage("");
    setTestOk(null);
    try {
      const response = await fetch("/api/llm-config/test", { method: "POST" });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        hint?: string;
        provider?: string;
      };
      setTestOk(Boolean(payload.ok));
      setTestMessage(
        payload.ok
          ? payload.message ?? "连接成功"
          : `${payload.message ?? "连接失败"}${payload.hint ? ` ${payload.hint}` : ""}`,
      );
      if (!payload.ok) {
        toast.error("连接失败");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div
        className={
          config.demo
            ? "rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm"
            : "rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
        }
      >
        <p className="font-medium">
          当前运行模式：{config.mode}
          {config.demo ? "（classroom-fixture 演示稳定模式）" : `（${config.provider} 真实模式）`}
        </p>
        <p className="mt-1 break-words text-muted-foreground">{config.providerDescription}</p>
        {config.runtime.lastSwitchedAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            最近切换 {config.runtime.lastProvider} · {config.runtime.lastSwitchedAt}
          </p>
        ) : null}
      </div>
      {error ? <AdminError message={error} /> : null}
      {success ? <AdminSuccess message={success} /> : null}
      {config.resolveError ? (
        <AdminError message={`${config.resolveError.message} ${config.resolveError.hint}`} />
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>当前 Provider</CardTitle>
            <CardDescription>切换会写入 llm-config.json 与 runtime-fallback.json。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((provider) => (
                <Button
                  key={provider}
                  type="button"
                  size="sm"
                  variant={config.provider === provider ? "default" : "outline"}
                  disabled={busy}
                  onClick={() => void switchProvider(provider)}
                >
                  {provider}
                </Button>
              ))}
            </div>
            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">默认模型</span>
              <Input value={model} onChange={(event) => setModel(event.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">温度</span>
                <Input value={temperature} onChange={(event) => setTemperature(event.target.value)} />
              </label>
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Token 上限</span>
                <Input value={maxTokens} onChange={(event) => setMaxTokens(event.target.value)} />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => void save()}>
                保存配置
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => void testConnection()}>
                测试连接
              </Button>
            </div>
            {testOk === true ? <AdminSuccess message={testMessage} /> : null}
            {testOk === false ? <AdminError message={testMessage} /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>环境变量状态</CardTitle>
            <CardDescription>只显示是否已配置，不返回密钥原文。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(config.env).map(([name, flag]) => (
              <div key={name} className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs">{name}</span>
                <StatusBadge
                  label={flag.set ? "已配置" : "未配置"}
                  tone={flag.set ? "success" : "warning"}
                />
              </div>
            ))}
            <p className="text-xs break-words text-muted-foreground">{config.hint}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>模型列表</CardTitle>
          <CardDescription>按 Provider 分组的可选模型，不含密钥。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {config.models.map((item) => (
            <div key={`${item.provider}-${item.id}`} className="rounded-lg border border-border p-3 text-sm">
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.provider}</p>
              <p className="mt-1 break-words text-muted-foreground">{item.description}</p>
              {item.provider === "classroom-fixture" ? (
                <StatusBadge label="演示稳定模式" tone="warning" />
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
