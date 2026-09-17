import "server-only";

import { listQualifications } from "@/lib/catalog-repo";
import type { QualificationRecord } from "@/lib/types";

export async function queryQualifications(input: {
  keyword?: string;
  subcontractorId?: string;
}): Promise<QualificationRecord[]> {
  const all = await listQualifications();
  const subcontractorId = input.subcontractorId?.trim() ?? "";
  const keyword = input.keyword?.trim() ?? "";

  return all.items.filter((item) => {
    if (subcontractorId && item.subcontractorId !== subcontractorId) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    return [item.name, item.type, item.certNo, item.status, item.note, item.subcontractorId].some(
      (value) => value.includes(keyword),
    );
  });
}
