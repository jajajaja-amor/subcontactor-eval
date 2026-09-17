import "server-only";

import { listLogistics } from "@/lib/catalog-repo";

export async function queryLogistics(orderId: string) {
  const records = await listLogistics();
  return records.items.filter((item) => item.orderId === orderId);
}
