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
import { listSkillVersions, listSkills } from "@/lib/ops-repo";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const [skills, versions] = await Promise.all([listSkills(), listSkillVersions()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Skills"
        description="客服 Agent 的可发布能力。版本记录与运行评测绑定，不在这里做营销介绍。"
      />
      <Card>
        <CardHeader>
          <CardTitle>Skill 目录</CardTitle>
          <CardDescription>当前 {skills.items.length} 个 Skill。</CardDescription>
        </CardHeader>
        <CardContent>
          {skills.items.length === 0 ? (
            <EmptyState title="暂无 Skill" description="发布第一个排班或政策 Skill 后会出现在此。" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>触发</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skills.items.map((skill) => (
                  <TableRow key={skill.id}>
                    <TableCell>
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {skill.description}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{skill.version}</TableCell>
                    <TableCell>
                      <StatusBadge label={skill.status} tone={statusTone(skill.status)} />
                    </TableCell>
                    <TableCell>{skill.trigger}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>版本记录</CardTitle>
          <CardDescription>用于回滚候选与 changelog 追踪。</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>说明</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.items.map((version) => (
                <TableRow key={version.id}>
                  <TableCell className="font-mono text-xs">{version.skillId}</TableCell>
                  <TableCell>{version.version}</TableCell>
                  <TableCell>
                    <StatusBadge label={version.status} tone={statusTone(version.status)} />
                  </TableCell>
                  <TableCell>{version.changelog}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
