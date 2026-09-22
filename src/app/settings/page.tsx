import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLlmConfig, getRuntimeFallback } from "@/lib/ops-repo";
import { getStoreDataDir } from "@/lib/store";
import { resolveLlmProvider } from "@/lib/agent/llm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [llm, fallback] = await Promise.all([getLlmConfig(), getRuntimeFallback()]);
  let providerLabel = llm.provider;
  let providerHint = "";
  try {
    const resolved = await resolveLlmProvider();
    providerLabel = `${resolved.name} / ${resolved.model}`;
  } catch (error) {
    providerHint = error instanceof Error ? error.message : "Provider 配置不完整";
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="运行配置"
        description="LLM 与降级策略来自服务端 JSON。数据目录由 DATA_DIR 或项目根目录推导。"
      />
      <Card>
        <CardHeader>
          <CardTitle>LLM</CardTitle>
          <CardDescription>主模型失败时切换 fallbackModel。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>配置文件提供方：{llm.provider}</p>
          <p>解析后：{providerLabel}</p>
          <p>主模型：{llm.model}</p>
          <p>温度：{llm.temperature}</p>
          <p>最大 Token：{llm.maxTokens}</p>
          <p>降级模型：{llm.fallbackModel}</p>
          <p className="sm:col-span-2 text-muted-foreground">
            环境变量 LLM_PROVIDER 优先于配置文件。可选 coze、openai-compatible、classroom-fixture。
            openai-compatible 需要 OPENAI_API_KEY、OPENAI_BASE_URL、LLM_MODEL。缺少配置不会静默降级。
            {providerHint ? ` ${providerHint}` : ""}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>运行时降级</CardTitle>
          <CardDescription>{fallback.strategy}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <StatusBadge
            label={fallback.enabled ? "降级已开启" : "降级已关闭"}
            tone={fallback.enabled ? "success" : "warning"}
          />
          <p>连续失败 {fallback.humanTakeoverAfterFailures} 次后接管。</p>
          <p>接管话术：{fallback.message}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>存储路径</CardTitle>
          <CardDescription>仅服务端可读，不向浏览器暴露文件内容写入接口（除临时自检）。</CardDescription>
        </CardHeader>
        <CardContent className="font-mono text-xs break-all">
          {getStoreDataDir()}
        </CardContent>
      </Card>
    </div>
  );
}
