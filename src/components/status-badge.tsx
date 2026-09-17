import { cn } from "@/lib/utils";

const TONE_CLASS: Record<string, string> = {
  success: "bg-emerald-700",
  warning: "bg-amber-700",
  danger: "bg-red-700",
  info: "bg-sky-800",
  muted: "bg-stone-500",
};

export function StatusBadge({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: keyof typeof TONE_CLASS;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span
        className={cn("size-1.5 shrink-0 rounded-full", TONE_CLASS[tone])}
        aria-hidden="true"
      />
      <span>{label}</span>
    </span>
  );
}

export function statusTone(status: string): keyof typeof TONE_CLASS {
  if (
    ["可接单", "进行中", "可领取", "正常", "已发布", "已启用", "成功", "已解决", "已完成", "已上线", "当前"].includes(
      status,
    )
  ) {
    return "success";
  }
  if (
    ["暂停接单", "待处理", "处理中", "待运行", "草稿", "调试中", "待评估", "待进场"].includes(
      status,
    )
  ) {
    return "warning";
  }
  if (
    [
      "已下架",
      "失败",
      "已停用",
      "已过期",
      "异常",
      "待人工接管",
      "紧急",
      "已拒绝",
    ].includes(status)
  ) {
    return "danger";
  }
  if (["施工中", "在途", "已接管", "运行中"].includes(status)) {
    return "info";
  }
  return "muted";
}
