import "server-only";

import { listSubcontractors } from "@/lib/catalog-repo";
import type { Subcontractor } from "@/lib/types";

export async function querySubcontractors(input: {
  keyword?: string;
  region?: string;
  trade?: string;
}): Promise<Subcontractor[]> {
  const all = await listSubcontractors();
  const keyword = input.keyword?.trim() ?? "";
  const region = input.region?.trim() ?? "";
  const trade = input.trade?.trim() ?? "";

  return all.items.filter((item) => {
    const blob = [item.name, item.specialty, item.region, item.status, ...item.trades, ...item.tags].join(" ");
    if (keyword && !blob.includes(keyword)) {
      return false;
    }
    if (region && !item.region.includes(region)) {
      return false;
    }
    if (trade && !item.trades.some((value) => value.includes(trade))) {
      return false;
    }
    return true;
  });
}
