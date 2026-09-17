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
import { getToolsConfig, listTools } from "@/lib/ops-repo";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const [tools, config] = await Promise.all([listTools(), getToolsConfig()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tools"
        description="Agent 可调用的查询与升级工具。高风险工具默认沙箱，人工可覆盖。"
      />
      <Card>
        <CardHeader>
          <CardTitle>运行参数</CardTitle>
          <CardDescription>来自 tools-config.json，不在客户端改文件。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <p>超时 {config.timeoutMs} ms</p>
          <p>最大重试 {config.maxRetries}</p>
          <StatusBadge
            label={config.allowHumanOverride ? "允许人工覆盖" : "禁止人工覆盖"}
            tone={config.allowHumanOverride ? "success" : "warning"}
          />
          <StatusBadge
            label={config.sandbox ? "沙箱已开启" : "沙箱已关闭"}
            tone={config.sandbox ? "success" : "danger"}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>工具列表</CardTitle>
          <CardDescription>风险等级同时用文字标明。</CardDescription>
        </CardHeader>
        <CardContent>
          {tools.items.length === 0 ? (
            <EmptyState title="暂无工具" description="在 tools/ 实现查询函数后登记到 tools.json。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>工具</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>风险</TableHead>
                  <TableHead>端点</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.items.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <div className="font-medium">{tool.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {tool.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge label={tool.status} tone={statusTone(tool.status)} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={`${tool.risk}风险`}
                        tone={tool.risk === "高" ? "danger" : tool.risk === "中" ? "warning" : "success"}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tool.endpoint}</TableCell>
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
