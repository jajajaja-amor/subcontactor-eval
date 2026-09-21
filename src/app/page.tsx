import { PageHeader } from "@/components/page-header";
import { AgentWorkbench } from "@/components/agent-workbench";

export const dynamic = "force-dynamic";

export default function AgentHomePage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Agent 工作台"
        description="问题会经过 mandatoryCapabilities → Planner → Plan Validator → Executor → risk-check，结果写入 RunRecord（source=web）。不会静默降级成演示模式。"
      />
      <AgentWorkbench source="web" />
    </div>
  );
}
