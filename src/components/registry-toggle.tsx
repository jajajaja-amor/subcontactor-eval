"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function RegistryToggle({
  kind,
  id,
  enabled,
}: {
  kind: "skills" | "tools";
  id: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const response = await fetch(`/api/${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: enabled ? "disable" : "enable",
          id,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "状态未更新");
      }
      toast.success(enabled ? "已停用" : "已启用");
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
      variant={enabled ? "outline" : "default"}
      disabled={busy}
      onClick={() => void onClick()}
    >
      {busy ? "正在处理" : enabled ? "停用" : "启用"}
    </Button>
  );
}
