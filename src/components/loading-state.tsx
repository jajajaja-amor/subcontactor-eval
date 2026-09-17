import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ label = "正在加载运营数据" }: { label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite">
      <p className="text-sm text-muted-foreground">{label}…</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
