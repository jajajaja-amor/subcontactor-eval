"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RunRecord } from "@/lib/types";

export function RunDetailActions({ runId }: { runId: string }) {
  const router = useRouter();
  const [issue, setIssue] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [explanation, setExplanation] = useState("");
  const [busy, setBusy] = useState(false);

  async function post(path: string, body?: unknown) {
    setBusy(true);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        run?: RunRecord;
        explanation?: { title: string; summary: string; details: string[] };
      };
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.message ?? "操作失败");
      }
      if (payload.explanation) {
        setExplanation(
          [payload.explanation.title, payload.explanation.summary, ...(payload.explanation.details ?? [])].join(
            "\n",
          ),
        );
      }
      toast.success("已保存");
      router.refresh();
    } catch (error) {
      toast.error("操作失败", {
        description: error instanceof Error ? error.message : "请重试",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => void post(`/api/runs/${runId}/retry`)}>
          重试
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void post(`/api/runs/${runId}/handoff`)}
        >
          人工接管
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => void post("/api/explain", { runId, riskResult: true })}
        >
          解释风险判断
        </Button>
      </div>
      {explanation ? (
        <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 text-sm">{explanation}</pre>
      ) : null}
      <div className="grid gap-2">
        <Input
          value={issue}
          onChange={(event) => setIssue(event.target.value)}
          placeholder="标注问题"
        />
        <Textarea
          value={suggestion}
          onChange={(event) => setSuggestion(event.target.value)}
          placeholder="改进建议"
          className="min-h-24"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy || !issue.trim() || !suggestion.trim()}
          onClick={() =>
            void post(`/api/runs/${runId}/annotate`, {
              issue,
              suggestion,
            })
          }
        >
          保存标注
        </Button>
      </div>
    </div>
  );
}
