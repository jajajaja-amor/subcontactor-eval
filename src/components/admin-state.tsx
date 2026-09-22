export function AdminLoading({ label = "正在读取服务端数据" }: { label?: string }) {
  return (
    <div className="rounded-xl border border-border px-4 py-8 text-sm text-muted-foreground">
      {label}…
    </div>
  );
}

export function AdminError({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-4 text-sm text-destructive">
      {message}
    </div>
  );
}

export function AdminSuccess({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-800">
      {message}
    </div>
  );
}
