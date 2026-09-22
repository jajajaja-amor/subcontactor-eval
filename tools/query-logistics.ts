import "server-only";

import { listLogistics, listOrders } from "@/lib/catalog-repo";

export async function queryLogistics(query: string) {
  const needle = query.trim();
  if (!needle) {
    return [];
  }

  const [records, orders] = await Promise.all([listLogistics(), listOrders()]);
  const orderById = new Map(orders.items.map((item) => [item.id, item]));
  return records.items.filter((item) => {
    const order = orderById.get(item.orderId);
    return [
      item.id,
      item.orderId,
      item.material,
      item.location,
      item.carrier,
      item.status,
      order?.projectName ?? "",
      order?.trade ?? "",
      order?.workOrderNo ?? "",
    ].some((value) => value.includes(needle));
  });
}
