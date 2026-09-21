import Link from "next/link";
import { notFound } from "next/navigation";

import { PlanCard, ReplyCard, StepsTable } from "@/components/agent-trace";
import { PageHeader } from "@/components/page-header";
import { RunDetailActions } from "@/components/run-detail-actions";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { getRunRecord } from "@/lib/agent/run-records";
import { listAnnotations } from "@/lib/ops-repo";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const run = await getRunRecord(runId);
  if (!run) {
    notFound();
  }
  const annotations = await listAnnotations();
  const related = annotations.items.filter((item) => item.runId === run.id);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`运行 ${run.id}`}
        description={`source=${run.source} · ${run.provider}/${run.model} · ${run.durationMs}ms。刷新后记录仍在。`}
        actions={
          <Link href="/runs" className="text-sm text-primary underline-offset-4 hover:underline">
            返回列表
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge label={run.status} tone={statusTone(run.status)} />
        <span>问题：{run.question}</span>
      </div>
      {run.error ? <p className="text-sm text-destructive">{run.error}</p> : null}
      <RunDetailActions runId={run.id} />
      <PlanCard plan={run.plan} />
      <ReplyCard reply={run.finalReply} risk={run.riskResult} />
      <StepsTable steps={run.steps} />
      <section className="rounded-xl border border-border p-4 text-sm">
        <h2 className="font-medium">标注</h2>
        {related.length === 0 ? (
          <p className="mt-2 text-muted-foreground">暂无标注。</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {related.map((item) => (
              <li key={item.id}>
                <p className="font-medium">{item.issue}</p>
                <p className="text-muted-foreground">{item.suggestion}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
