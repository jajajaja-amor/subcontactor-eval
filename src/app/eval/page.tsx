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
import {
  listAbTests,
  listEvalBatches,
  listEvalCases,
  listImprovements,
} from "@/lib/ops-repo";

export const dynamic = "force-dynamic";

export default async function EvalPage() {
  const [cases, batches, abTests, improvements] = await Promise.all([
    listEvalCases(),
    listEvalBatches(),
    listAbTests(),
    listImprovements(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Eval"
        description="评测集、批次、A/B 和改进项。用于验证排班、物流、优惠和返工政策回答是否达标。"
      />
      <Card>
        <CardHeader>
          <CardTitle>评测用例</CardTitle>
          <CardDescription>{cases.items.length} 条中文场景。</CardDescription>
        </CardHeader>
        <CardContent>
          {cases.items.length === 0 ? (
            <EmptyState title="暂无用例" description="从标注和改进项沉淀评测用例。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用例</TableHead>
                  <TableHead>Skill</TableHead>
                  <TableHead>期望</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.input}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.skillId}</TableCell>
                    <TableCell>{item.expected}</TableCell>
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
            <CardTitle>评测批次</CardTitle>
            <CardDescription>通过率不只靠颜色，数字和文字都会显示。</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>批次</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>通过率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.items.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>{batch.name}</TableCell>
                    <TableCell>
                      <StatusBadge label={batch.status} tone={statusTone(batch.status)} />
                    </TableCell>
                    <TableCell>
                      {batch.passRate == null
                        ? "尚未出分"
                        : `${Math.round(batch.passRate * 100)}%`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>A/B 与改进</CardTitle>
            <CardDescription>流量实验和改进项分开跟踪。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>实验</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>流量</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {abTests.items.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.name}</TableCell>
                    <TableCell>
                      <StatusBadge label={test.status} tone={statusTone(test.status)} />
                    </TableCell>
                    <TableCell>{test.trafficPercent}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>改进项</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>影响</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {improvements.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      <StatusBadge label={item.status} tone={statusTone(item.status)} />
                    </TableCell>
                    <TableCell>{item.impact}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
