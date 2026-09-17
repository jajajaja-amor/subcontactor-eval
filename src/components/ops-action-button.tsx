"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type OpsAction = "run" | "retry" | "takeover" | "eval";

export function OpsActionButton({
  action,
  id,
  label,
  variant = "default",
}: {
  action: OpsAction;
  id: string;
  label: string;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const response = await fetch("/api/runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "操作未完成");
      }
      toast.success("操作成功", { description: payload.message });
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
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={busy}
      onClick={() => void onClick()}
    >
      {busy ? "正在处理" : label}
    </Button>
  );
}
