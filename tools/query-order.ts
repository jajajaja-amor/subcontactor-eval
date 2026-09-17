import "server-only";

import { listOrders } from "@/lib/catalog-repo";

export async function queryOrder(keyword: string) {
  const needle = keyword.trim().toLowerCase();
  if (!needle) {
    return [];
  }

  const orders = await listOrders();
  return orders.items.filter((order) =>
    [order.id, order.contractNo, order.projectName, order.siteAddress].some(
      (value) => value.toLowerCase().includes(needle),
    ),
  );
}
