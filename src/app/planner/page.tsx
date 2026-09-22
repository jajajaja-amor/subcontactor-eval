import { PageHeader } from "@/components/page-header";
import { PlannerWorkbench } from "@/components/planner-workbench";
import { getPlannerConfig, listPlannerOptions } from "@/lib/planner-config";

export const dynamic = "force-dynamic";

export default async function PlannerPage() {
  const [config, options] = await Promise.all([getPlannerConfig(), listPlannerOptions()]);
  return (
    <div className="space-y-5">
      <PageHeader
        title="Planner"
        description="查看 Planner Prompt、勾选可用 Skill/Tool、设置 mandatoryCapabilities，并用测试问题预览计划。配置写入 planner-config.json。"
      />
      <PlannerWorkbench
        initialConfig={config}
        initialSkills={options.skills}
        initialTools={options.tools}
      />
    </div>
  );
}
