import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ToolWorkbench } from "@/components/tool-workbench";
import { getToolsConfig, listTools } from "@/lib/ops-repo";

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const [tools, config] = await Promise.all([listTools(), getToolsConfig()]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tools"
        description="查询分包商、项目、合同、工单、物流、资质和报价。可查看 schema、启用停用，并对真实 JSON 数据做单项测试。"
      />
      {tools.items.length === 0 ? (
        <EmptyState title="暂无工具" description="在 tools/ 实现查询函数后登记到 tools.json。" />
      ) : (
        <ToolWorkbench tools={tools.items} config={config} />
      )}
    </div>
  );
}
