"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

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

function scrollToolDetail() {
  queueMicrotask(() => {
    document.getElementById("tool-detail")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function ToolWorkbench({
  tools,
  config,
}: {
  tools: Tool[];
  config: ToolsConfig;
}) {
  const [selectedId, setSelectedId] = useState(tools[0]?.id ?? "");
  const selected = tools.find((item) => item.id === selectedId) ?? null;
  const [inputText, setInputText] = useState(
    JSON.stringify(selected?.sampleInput ?? {}, null, 2),
  );
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const schemaText = useMemo(
    () =>
      selected
        ? JSON.stringify(
            {
              inputSchema: selected.inputSchema,
              outputSchema: selected.outputSchema,
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
    setResult("");
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
    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          name: selected.name,
          input: parsed,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: unknown;
        message?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? payload.message ?? "测试失败");
      }
      setResult(JSON.stringify(payload.data, null, 2));
      toast.success("测试完成", { description: selected.name });
    } catch (error) {
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
          <CardDescription>
            当前 {tools.length} 个 Tool，启用 {tools.filter((item) => item.enabled).length} 个。
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                <TableRow
                  key={tool.id}
                  className={cn(tool.id === selectedId && "bg-muted/50")}
                >
                  <TableCell>
                    <button type="button" className="text-left" onClick={() => selectTool(tool)}>
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">{tool.description}</div>
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
                    <div className="flex justify-end gap-2">
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
              <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
                {schemaText}
              </pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>单项测试</CardTitle>
              <CardDescription>读取真实 data/*.json，而不是占位返回。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                className="min-h-40 font-mono text-xs"
              />
              <Button type="button" disabled={busy || !selected.enabled} onClick={() => void runTest()}>
                {busy ? "正在测试" : "运行测试"}
              </Button>
              {result ? (
                <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                  {result}
                </pre>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
