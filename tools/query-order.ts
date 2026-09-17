import "server-only";

import { listOrders } from "@/lib/catalog-repo";

export async function queryOrder(keyword: string) {
  const orders = await listOrders();
  const needle = keyword.trim().toLowerCase();
  return orders.items.filter((order) =>
    [order.id, order.contractNo, order.projectName].some((value) =>
      value.toLowerCase().includes(needle),
    ),
  );
}
