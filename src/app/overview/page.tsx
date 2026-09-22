import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { StoreSelfCheck } from "@/components/store-self-check";
import { TicketVolumeChart } from "@/components/ticket-volume-chart";
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
import { getOverviewData } from "@/lib/overview";

export const dynamic = "force-dynamic";

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default async function HomePage() {
  const overview = await getOverviewData();

  return (
    <div className="space-y-5">
      <PageHeader
        title="运营总览"
        description="客服 Agent、Planner、Skill、Tool 与 Eval 的当日工作台。先处理待接管工单，再回看运行质量和评测。"
        actions={
          <>
            <Button asChild>
              <Link href="/">打开工作台</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tickets">接管工单</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/eval">运行评测</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="待处理工单"
          value={String(overview.openTickets)}
          hint={`其中 ${overview.takeoverTickets} 单待人工接管`}
        />
        <Metric
          label="今日 Agent 运行"
          value={String(overview.todayRuns)}
          hint={`主模型 ${overview.llmModel}`}
        />
        <Metric
          label="已启用 Skill"
          value={String(overview.publishedSkills)}
          hint={`已启用 Skill ${overview.publishedSkills} · Tool ${overview.enabledTools}`}
        />
        <Metric
          label="运行评分"
          value={overview.averageScore == null ? "暂无" : String(overview.averageScore)}
          hint={
            overview.fallbackEnabled
              ? "运行时降级已开启"
              : "运行时降级已关闭"
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>近 7 日工单量</CardTitle>
            <CardDescription>按创建日期统计，便于观察进场和结算咨询高峰。</CardDescription>
          </CardHeader>
          <CardContent>
            <TicketVolumeChart data={overview.volume} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>目录快照</CardTitle>
            <CardDescription>分包目录与在手合同，供 Agent 工具查询。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <StatusBadge label={`分包商 ${overview.subcontractors} 家`} tone="info" />
            </p>
            <p>
              <StatusBadge label={`项目 ${overview.projects} 个`} tone="success" />
            </p>
            <p>
              <StatusBadge label={`合同 ${overview.contracts} 份 · 工单 ${overview.orders} 张`} />
            </p>
            <p className="text-muted-foreground">
              联系人 {overview.users} 人。启用 Skill {overview.publishedSkills} 个，启用 Tool{" "}
              {overview.enabledTools} 个。
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/catalog">打开业务目录</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/knowledge">打开知识库</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近工单</CardTitle>
          <CardDescription>状态同时用颜色圆点和文字表示。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>工单</TableHead>
                <TableHead>优先级</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>处理人</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.recentTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="font-medium">{ticket.title}</div>
                    <div className="text-xs text-muted-foreground">{ticket.id}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      label={ticket.priority}
                      tone={ticket.priority === "紧急" || ticket.priority === "高" ? "danger" : "warning"}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge label={ticket.status} tone={statusTone(ticket.status)} />
                  </TableCell>
                  <TableCell>{ticket.assignee}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近运行</CardTitle>
          <CardDescription>用于核对 Skill 调用是否成功、失败或已接管。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>运行</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时延</TableHead>
                <TableHead>摘要</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.recentRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="font-mono text-xs">{run.id}</TableCell>
                  <TableCell>
                    <StatusBadge label={run.status} tone={statusTone(run.status)} />
                  </TableCell>
                  <TableCell className="tabular-nums">{run.latencyMs} ms</TableCell>
                  <TableCell className="max-w-xl">{run.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <StoreSelfCheck />
    </div>
  );
}
