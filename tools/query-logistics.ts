import "server-only";

import { listLogistics } from "@/lib/catalog-repo";

export async function queryLogistics(query: string) {
  const needle = query.trim();
  if (!needle) {
    return [];
  }

  const records = await listLogistics();
  return records.items.filter((item) =>
    [item.id, item.orderId, item.material, item.location, item.carrier].some(
      (value) => value.includes(needle),
    ),
  );
}
