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
  listActivities,
  listCoupons,
  listFaqs,
  listLogistics,
  listOrders,
  listProducts,
  listReturnPolicies,
} from "@/lib/catalog-repo";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const [products, faqs, policies, logistics, orders, coupons, activities] =
    await Promise.all([
      listProducts(),
      listFaqs(),
      listReturnPolicies(),
      listLogistics(),
      listOrders(),
      listCoupons(),
      listActivities(),
    ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="知识库"
        description="分包目录、合同、进场物流、返工政策和优惠规则。这些数据只通过服务端 JSON 存储读取。"
      />
      <Tabs defaultValue="faq">
        <TabsList variant="line" className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="products">分包目录</TabsTrigger>
          <TabsTrigger value="orders">合同</TabsTrigger>
          <TabsTrigger value="logistics">进场物流</TabsTrigger>
          <TabsTrigger value="policies">返工政策</TabsTrigger>
          <TabsTrigger value="offers">优惠活动</TabsTrigger>
        </TabsList>
        <TabsContent value="faq" className="space-y-3 pt-4">
          {faqs.items.map((faq) => (
            <Card key={faq.id} size="sm">
              <CardHeader>
                <CardTitle>{faq.question}</CardTitle>
                <CardDescription>{faq.category}</CardDescription>
              </CardHeader>
              <CardContent>{faq.answer}</CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="products" className="grid gap-3 pt-4 md:grid-cols-2">
          {products.items.map((product) => (
            <Card key={product.id} size="sm">
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  {product.category} · {product.unitPrice} 元 / {product.unit}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <StatusBadge label={product.status} tone={statusTone(product.status)} />
                <p>{product.description}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="orders" className="space-y-3 pt-4">
          {orders.items.map((order) => (
            <Card key={order.id} size="sm">
              <CardHeader>
                <CardTitle>{order.projectName}</CardTitle>
                <CardDescription>
                  {order.contractNo} · {order.siteAddress}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBadge label={order.status} tone={statusTone(order.status)} />
              </CardContent>
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
        <TabsContent value="policies" className="space-y-3 pt-4">
          {policies.items.map((policy) => (
            <Card key={policy.id} size="sm">
              <CardHeader>
                <CardTitle>{policy.name}</CardTitle>
                <CardDescription>
                  {policy.appliesTo} · {policy.windowHours} 小时窗口
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{policy.summary}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="offers" className="grid gap-3 pt-4 md:grid-cols-2">
          {activities.items.map((activity) => (
            <Card key={activity.id} size="sm">
              <CardHeader>
                <CardTitle>{activity.name}</CardTitle>
                <CardDescription>{activity.discountNote}</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBadge label={activity.status} tone={statusTone(activity.status)} />
              </CardContent>
            </Card>
          ))}
          {coupons.items.map((coupon) => (
            <Card key={coupon.id} size="sm">
              <CardHeader>
                <CardTitle>{coupon.name}</CardTitle>
                <CardDescription>{coupon.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <StatusBadge label={coupon.status} tone={statusTone(coupon.status)} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
