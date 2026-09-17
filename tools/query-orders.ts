import "server-only";

import { listOrders } from "@/lib/catalog-repo";
import type { Order } from "@/lib/types";

export async function queryOrders(input: {
  keyword?: string;
  workOrderNo?: string;
}): Promise<Order[]> {
  const all = await listOrders();
  const workOrderNo = input.workOrderNo?.trim() ?? "";
  const keyword = input.keyword?.trim() ?? "";

  return all.items.filter((item) => {
    if (workOrderNo && item.workOrderNo !== workOrderNo && !item.workOrderNo.includes(workOrderNo)) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return [
      item.id,
      item.workOrderNo,
      item.contractNo,
      item.projectName,
      item.trade,
      item.status,
      item.progressStatus,
      item.acceptanceStatus,
      item.afterSalesStatus,
    ].some((value) => value.includes(keyword));
  });
}
