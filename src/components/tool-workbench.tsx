"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminError, AdminLoading, AdminSuccess } from "@/components/admin-state";
import { EmptyState } from "@/components/empty-state";
import { RegistryToggle } from "@/components/registry-toggle";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Tool, ToolsConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

type EnabledFilter = "all" | "enabled" | "disabled";
type ToolTestResult = {
  ok: boolean;
  input: Record<string, unknown>;
  output: unknown;
  durationMs: number;
  error?: string;
};

function scrollToolDetail() {
  queueMicrotask(() => {
    document.getElementById("tool-detail")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function ToolWorkbench({
  tools: initialTools,
  config,
}: {
  tools: Tool[];
  config: ToolsConfig;
}) {
  const [filter, setFilter] = useState<EnabledFilter>("all");
  const [tools, setTools] = useState(initialTools);
  const [listState, setListState] = useState<"success" | "loading" | "error">("success");
  const [listError, setListError] = useState("");
  const [selectedId, setSelectedId] = useState(initialTools[0]?.id ?? "");
  const selected = tools.find((item) => item.id === selectedId) ?? null;
  const [inputText, setInputText] = useState(
    JSON.stringify(selected?.sampleInput ?? {}, null, 2),
  );
  const [result, setResult] = useState<ToolTestResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [testError, setTestError] = useState("");

  const loadTools = useCallback(async (nextFilter: EnabledFilter) => {
    setListState("loading");
    setListError("");
    const query =
      nextFilter === "enabled" ? "?enabled=true" : nextFilter === "disabled" ? "?enabled=false" : "";
    try {
      const response = await fetch(`/api/tools${query}`);
      const payload = (await response.json()) as { tools?: Tool[]; message?: string };
      if (!response.ok || !payload.tools) {
        throw new Error(payload.message ?? "无法读取 Tool 列表");
      }
      setTools(payload.tools);
      setListState("success");
      setSelectedId((current) =>
        payload.tools!.some((item) => item.id === current) ? current : (payload.tools![0]?.id ?? ""),
      );
    } catch (error) {
      setListState("error");
      setListError(error instanceof Error ? error.message : "读取失败");
    }
  }, []);

  const schemaText = useMemo(
    () =>
      selected
        ? JSON.stringify(
            {
              inputSchema: selected.inputSchema,
              outputSchema: selected.outputSchema,
              sampleInput: selected.sampleInput,
            },
            null,
            2,
          )
        : "",
    [selected],
  );

  function selectTool(tool: Tool) {
    setSelectedId(tool.id);
    setInputText(JSON.stringify(tool.sampleInput ?? {}, null, 2));
    setResult(null);
    setTestError("");
    scrollToolDetail();
  }

  async function runTest() {
    if (!selected) {
      return;
    }
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(inputText) as Record<string, unknown>;
    } catch {
      toast.error("输入不是合法 JSON");
      return;
    }
    setBusy(true);
    setTestError("");
    setResult(null);
    try {
      const response = await fetch(`/api/tools/${selected.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: parsed }),
      });
      const payload = (await response.json()) as ToolTestResult & { message?: string };
      setResult({
        ok: Boolean(payload.ok),
        input: payload.input ?? parsed,
        output: payload.output ?? null,
        durationMs: payload.durationMs ?? 0,
        error: payload.error ?? payload.message,
      });
      if (!response.ok || !payload.ok) {
        setTestError(payload.error ?? payload.message ?? "测试失败，未伪装成功");
        toast.error("测试失败", { description: payload.error ?? payload.message });
        return;
      }
      toast.success("服务端 Tool 已返回真实结果");
    } catch (error) {
      setTestError(error instanceof Error ? error.message : "测试失败");
      toast.error("测试失败", {
        description: error instanceof Error ? error.message : "请重试",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>运行参数</CardTitle>
          <CardDescription>来自 tools-config.json，不在客户端改文件。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p>超时 {config.timeoutMs} ms</p>
          <p>最大重试 {config.maxRetries}</p>
          <StatusBadge
            label={config.allowHumanOverride ? "允许人工覆盖" : "禁止人工覆盖"}
            tone={config.allowHumanOverride ? "success" : "warning"}
          />
          <StatusBadge
            label={config.sandbox ? "沙箱已开启" : "沙箱已关闭"}
            tone={config.sandbox ? "success" : "danger"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>工具列表</CardTitle>
          <CardDescription>描述、输入 schema、输出示例和启用状态来自服务端 tools.json。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "全部"],
                ["enabled", "已启用"],
                ["disabled", "已停用"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filter === value ? "default" : "outline"}
                onClick={() => {
                  setFilter(value);
                  void loadTools(value);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          {listState === "loading" ? <AdminLoading label="正在读取 Tool 列表" /> : null}
          {listState === "error" ? <AdminError message={listError} /> : null}
          {listState === "success" && tools.length === 0 ? (
            <EmptyState title="没有符合筛选的 Tool" description="切换筛选或检查 tools.json。" />
          ) : null}
          {listState === "success" && tools.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>工具</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>风险</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.id} className={cn(tool.id === selectedId && "bg-muted/50")}>
                      <TableCell className="min-w-48">
                        <button type="button" className="text-left" onClick={() => selectTool(tool)}>
                          <div className="font-medium">{tool.name}</div>
                          <div className="text-xs break-words text-muted-foreground">
                            {tool.description}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <StatusBadge
                            label={tool.enabled ? "启用" : "停用"}
                            tone={tool.enabled ? "success" : "danger"}
                          />
                          <StatusBadge label={tool.status} tone={statusTone(tool.status)} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={`${tool.risk}风险`}
                          tone={tool.risk === "高" ? "danger" : tool.risk === "中" ? "warning" : "success"}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => selectTool(tool)}
                          >
                            查看 schema
                          </Button>
                          <RegistryToggle kind="tools" id={tool.id} enabled={tool.enabled} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selected ? (
        <div id="tool-detail" className="scroll-mt-24 grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{selected.name} schema</CardTitle>
              <CardDescription>{selected.endpoint}</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs break-words whitespace-pre-wrap">
                {schemaText}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>单项测试</CardTitle>
              <CardDescription>
                POST /api/tools/{selected.id}/test 调用服务端真实 Tool，不会在浏览器伪造结果。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                className="min-h-40 font-mono text-xs"
              />
              <Button type="button" disabled={busy} onClick={() => void runTest()}>
                {busy ? "正在测试" : "运行测试"}
              </Button>
              {busy ? <AdminLoading label="正在调用服务端 Tool" /> : null}
              {testError ? <AdminError message={testError} /> : null}
              {result?.ok ? <AdminSuccess message={`真实调用成功，耗时 ${result.durationMs}ms`} /> : null}
              {result ? (
                <div className="space-y-2 text-xs">
                  <p>耗时 {result.durationMs}ms · {result.ok ? "成功" : "失败"}</p>
                  <pre className="max-h-40 overflow-auto rounded-lg bg-muted p-3 break-words whitespace-pre-wrap">
                    {JSON.stringify(
                      {
                        input: result.input,
                        output: result.output,
                        error: result.error ?? null,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
