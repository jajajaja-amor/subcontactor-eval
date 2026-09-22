import { PageHeader } from "@/components/page-header";
import { AgentWorkbench } from "@/components/agent-workbench";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="课堂演示"
        description="简化聊天页，调用同一条 Agent 主链路，RunRecord.source 为 demo。课堂 fixture 仍会生成计划、执行工具并做风险评分。"
      />
      <AgentWorkbench source="demo" compact />
    </div>
  );
}
