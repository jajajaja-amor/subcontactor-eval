import { EmptyState } from "@/components/empty-state";
import { OpsActionButton } from "@/components/ops-action-button";
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
import { listTickets } from "@/lib/ops-repo";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const tickets = await listTickets();

  return (
    <div className="space-y-5">
      <PageHeader
        title="工单"
        description="客服会话与现场咨询进入 Agent 后的运营队列。需要人工确认卸货口、合同互斥规则时点“接管”。"
      />
      <Card>
        <CardHeader>
          <CardTitle>当前队列</CardTitle>
          <CardDescription>共 {tickets.items.length} 条演示工单。</CardDescription>
        </CardHeader>
        <CardContent>
          {tickets.items.length === 0 ? (
            <EmptyState title="暂无工单" description="新的咨询进入后会显示在这里。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>渠道</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>处理人</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.items.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div className="font-medium">{ticket.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {ticket.summary}
                      </div>
                    </TableCell>
                    <TableCell>{ticket.channel}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={ticket.priority}
                        tone={
                          ticket.priority === "紧急" || ticket.priority === "高"
                            ? "danger"
                            : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={ticket.status} tone={statusTone(ticket.status)} />
                    </TableCell>
                    <TableCell>{ticket.assignee}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        {ticket.status === "已关闭" ? (
                          <span className="text-xs text-muted-foreground">已关闭</span>
                        ) : (
                          <>
                            <OpsActionButton action="run" id={ticket.id} label="运行" />
                            {ticket.status === "处理中" || ticket.status === "待处理" ? (
                              <OpsActionButton
                                action="retry"
                                id={ticket.id}
                                label="重试"
                                variant="outline"
                              />
                            ) : null}
                            <OpsActionButton
                              action="takeover"
                              id={ticket.id}
                              label="接管"
                              variant="outline"
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
