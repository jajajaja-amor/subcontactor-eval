"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TestResponse = {
  ok: boolean;
  action: string;
  result: Record<string, unknown>;
};

export function StoreSelfCheck() {
  const [busy, setBusy] = useState<"lock" | "atomic" | null>(null);
  const [lastMessage, setLastMessage] = useState("尚未运行");

  async function run(action: "lock" | "atomic") {
    setBusy(action);
    try {
      const response = await fetch("/api/store-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as TestResponse & { error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "存储自检未通过");
      }
      const message =
        action === "lock"
          ? `锁生效：${String(payload.result.counter)}/${String(payload.result.expected)} 次写入已串行完成`
          : "原子写入生效：失败写入未覆盖上一份有效数据";
      setLastMessage(message);
      toast.success("自检通过", { description: message });
    } catch (error) {
      const message = error instanceof Error ? error.message : "存储自检失败";
      setLastMessage(message);
      toast.error("自检失败", { description: message });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>JSON 存储自检</CardTitle>
        <CardDescription>
          进程内按文件加锁，临时文件写入后原子 rename。客户端不能直接读写 data 文件。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{lastMessage}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => void run("lock")}
            disabled={busy !== null}
          >
            {busy === "lock" ? "正在运行" : "运行锁测试"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void run("atomic")}
            disabled={busy !== null}
          >
            {busy === "atomic" ? "正在测试" : "测试失败保留"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
