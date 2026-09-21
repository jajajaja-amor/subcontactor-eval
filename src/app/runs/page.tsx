import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, statusTone } from "@/components/status-badge";
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
import { listAnnotations, listRatings, listRuns } from "@/lib/ops-repo";
import { listRunRecords } from "@/lib/agent/run-records";

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const [runs, records, ratings, annotations] = await Promise.all([
    listRuns(),
    listRunRecords(),
    listRatings(),
    listAnnotations(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="运行记录"
        description="每次 Skill 调用都会留下时延、模型和摘要，供标注和改进使用。"
      />
      <Card>
        <CardHeader>
          <CardTitle>Agent RunRecord</CardTitle>
          <CardDescription>
            主链路运行 {records.items.length} 条。点进详情可重试、接管和标注。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {records.items.length === 0 ? (
            <EmptyState title="暂无 Agent 运行" description="在工作台或 /demo 提问后会出现在这里。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>来源</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>问题</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">
                      <Link className="text-primary underline-offset-4 hover:underline" href={`/runs/${item.id}`}>
                        {item.id}
                      </Link>
                    </TableCell>
                    <TableCell>{item.source}</TableCell>
                    <TableCell>
                      <StatusBadge label={item.status} tone={statusTone(item.status)} />
                    </TableCell>
                    <TableCell className="max-w-xl">{item.question}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>工单 Runs</CardTitle>
          <CardDescription>{runs.items.length} 次工单 Skill 调用。</CardDescription>
        </CardHeader>
        <CardContent>
          {runs.items.length === 0 ? (
            <EmptyState title="暂无运行" description="工单被 Agent 接手后会生成运行记录。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>模型</TableHead>
                  <TableHead>摘要</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.items.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs">{run.id}</TableCell>
                    <TableCell>
                      <StatusBadge label={run.status} tone={statusTone(run.status)} />
                    </TableCell>
                    <TableCell>{run.model}</TableCell>
                    <TableCell>{run.summary}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>评分</CardTitle>
            <CardDescription>满意 / 一般 / 不满意均带文字标签。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ratings.items.map((rating) => (
              <div key={rating.id} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <StatusBadge
                  label={`${rating.label} ${rating.score} 分`}
                  tone={rating.score >= 4 ? "success" : rating.score >= 3 ? "warning" : "danger"}
                />
                <p className="mt-1">{rating.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>标注</CardTitle>
            <CardDescription>失败与接管案例沉淀改进项。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {annotations.items.map((item) => (
              <div key={item.id} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <p className="font-medium">{item.issue}</p>
                <p className="mt-1 text-muted-foreground">{item.suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
