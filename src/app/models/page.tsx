import { PageHeader } from "@/components/page-header";
import { ModelsWorkbench } from "@/components/models-workbench";
import { getPublicLlmConfig } from "@/lib/llm-admin";

export const dynamic = "force-dynamic";

export default async function ModelsPage() {
  const initial = await getPublicLlmConfig();
  return (
    <div className="space-y-5">
      <PageHeader
        title="模型"
        description="管理 LLM Provider。切换会写入服务端配置和 runtime-fallback.json，不会静默把真实模式降级成演示。"
      />
      <ModelsWorkbench initial={initial} />
    </div>
  );
}
