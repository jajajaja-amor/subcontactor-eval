import { PageHeader } from "@/components/page-header";
import { StatusBadge, statusTone } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listContracts,
  listFaqs,
  listHandoffRules,
  listLogistics,
  listOrders,
  listProjects,
  listQualifications,
  listReturnPolicies,
  listSubcontractors,
  listUsers,
} from "@/lib/catalog-repo";

export const dynamic = "force-dynamic";

function money(value: number) {
  return `${value.toLocaleString("zh-CN")} 元`;
}

export default async function CatalogPage() {
  const [
    subcontractors,
    projects,
    contracts,
    orders,
    users,
    policies,
    faqs,
    logistics,
    qualifications,
    handoff,
  ] = await Promise.all([
    listSubcontractors(),
    listProjects(),
    listContracts(),
    listOrders(),
    listUsers(),
    listReturnPolicies(),
    listFaqs(),
    listLogistics(),
    listQualifications(),
    listHandoffRules(),
  ]);

  const subName = new Map(subcontractors.items.map((item) => [item.id, item.name]));
  const projectName = new Map(projects.items.map((item) => [item.id, item.name]));

  return (
    <div className="space-y-5">
      <PageHeader
        title="业务数据目录"
        description="按类型查看分包商、项目、合同、工单、用户、售后政策、FAQ、物流、转人工规则和资质合规摘要。"
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["分包商", subcontractors.items.length],
          ["项目", projects.items.length],
          ["合同", contracts.items.length],
          ["工单", orders.items.length],
          ["用户", users.items.length],
        ].map(([label, count]) => (
          <Card key={String(label)} size="sm">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="subcontractors">
        <TabsList variant="line" className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="subcontractors">分包商</TabsTrigger>
          <TabsTrigger value="projects">项目</TabsTrigger>
          <TabsTrigger value="contracts">合同</TabsTrigger>
          <TabsTrigger value="orders">工单</TabsTrigger>
          <TabsTrigger value="users">用户</TabsTrigger>
          <TabsTrigger value="policies">售后政策</TabsTrigger>
          <TabsTrigger value="faqs">FAQ</TabsTrigger>
          <TabsTrigger value="logistics">物流</TabsTrigger>
          <TabsTrigger value="qualifications">资质合规</TabsTrigger>
          <TabsTrigger value="handoff">转人工</TabsTrigger>
        </TabsList>

        <TabsContent value="subcontractors" className="grid gap-3 pt-4 md:grid-cols-2">
          {subcontractors.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>
                  {item.specialty} · {item.qualificationLevel} · {item.region}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
                <p>工种 {item.trades.join("、")}</p>
                <p>
                  报价 {item.quoteMin}-{item.quoteMax} {item.quoteUnit}
                </p>
                <p>档期 {item.availableSlots.join("、") || "暂无"}</p>
                <p>履约评分 {item.performanceScore}</p>
                <p className="text-muted-foreground">
                  合作：{item.history.join("；") || "新合作"} · 标签 {item.tags.join("、")}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="projects" className="grid gap-3 pt-4 md:grid-cols-2">
          {projects.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>
                  {item.type} · {item.bidSection}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
                <p>{item.siteAddress}</p>
                <p>
                  {item.startAt.slice(0, 10)} 至 {item.endAt.slice(0, 10)}
                </p>
                <p>
                  预算 {money(item.budgetMin)} - {money(item.budgetMax)}
                </p>
                <p>分包需求 {item.subcontractNeeds.join("、")}</p>
                <p className="text-muted-foreground">{item.acceptanceStandard}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="contracts" className="space-y-3 pt-4">
          {contracts.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.contractNo}</CardTitle>
                <CardDescription>
                  {subName.get(item.subcontractorId) ?? item.subcontractorId} ·{" "}
                  {projectName.get(item.projectId) ?? item.projectId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge
                  label={item.settlementStatus}
                  tone={statusTone(item.settlementStatus)}
                />
                <p>金额 {money(item.amount)} · {item.pricingMethod}</p>
                <p>付款节点 {item.paymentMilestones.join("、")}</p>
                <p>{item.warranty}</p>
                <p className="text-muted-foreground">
                  变更 {item.changes.length} 条
                  {item.changes[0] ? `，最近：${item.changes[0].note}` : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="orders" className="space-y-3 pt-4">
          {orders.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.workOrderNo}</CardTitle>
                <CardDescription>
                  {item.projectName} · {subName.get(item.subcontractorId) ?? item.subcontractorId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
                <p>
                  {item.trade} {item.quantity} {item.unit} · {money(item.amount)}
                </p>
                <p>进度 {item.progressStatus}</p>
                <p>验收 {item.acceptanceStatus} · 售后 {item.afterSalesStatus}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="users" className="grid gap-3 pt-4 md:grid-cols-2">
          {users.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>
                  {item.party} · {item.role} · {item.company}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
                <p>历史合作 {item.history.join("、")}</p>
                <p className="text-muted-foreground">偏好 {item.preferences.join("；")}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="policies" className="space-y-3 pt-4">
          {policies.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>
                  {item.category} · {item.appliesTo} · {item.windowHours} 小时
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">{item.summary}</CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="faqs" className="space-y-3 pt-4">
          {faqs.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.question}</CardTitle>
                <CardDescription>
                  {item.category} · {item.tags.join("、")}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">{item.answer}</CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="logistics" className="space-y-3 pt-4">
          {logistics.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.material}</CardTitle>
                <CardDescription>
                  {item.carrier} · {item.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="qualifications" className="space-y-3 pt-4">
          {qualifications.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>
                  {item.type} · {subName.get(item.subcontractorId) ?? item.subcontractorId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge label={item.status} tone={statusTone(item.status)} />
                <p>证号 {item.certNo || "未登记"}</p>
                <p className="text-muted-foreground">{item.note}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="handoff" className="space-y-3 pt-4">
          {handoff.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.trigger}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <StatusBadge
                  label={item.enabled ? "启用" : "停用"}
                  tone={item.enabled ? "success" : "danger"}
                />
                <p>{item.action}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
