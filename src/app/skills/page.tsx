import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SkillWorkbench } from "@/components/skill-workbench";
import { listSkillVersions, listSkills } from "@/lib/ops-repo";

export const dynamic = "force-dynamic";

export default async function SkillsPage() {
  const [skills, versions] = await Promise.all([listSkills(), listSkillVersions()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Skills"
        description="注册、启用和版本管理客服 Agent 能力。Planner 与 Executor 通过 /api/registry 只读取当前启用的 Skill。"
      />
      {skills.items.length === 0 ? (
        <EmptyState title="暂无 Skill" description="在 skills.json 登记后会出现在此。" />
      ) : (
        <SkillWorkbench skills={skills.items} versions={versions.items} />
      )}
    </div>
  );
}
