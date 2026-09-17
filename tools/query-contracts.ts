import "server-only";

import { listContracts } from "@/lib/catalog-repo";
import type { Contract } from "@/lib/types";

export async function queryContracts(input: {
  keyword?: string;
  contractNo?: string;
}): Promise<Contract[]> {
  const all = await listContracts();
  const contractNo = input.contractNo?.trim() ?? "";
  const keyword = input.keyword?.trim() ?? "";

  return all.items.filter((item) => {
    if (contractNo && item.contractNo !== contractNo && !item.contractNo.includes(contractNo)) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return [item.id, item.contractNo, item.pricingMethod, item.warranty, item.settlementStatus].some(
      (value) => value.includes(keyword),
    );
  });
}
