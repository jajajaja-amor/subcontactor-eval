import "server-only";

import { listProjects } from "@/lib/catalog-repo";
import type { Project } from "@/lib/types";

export async function queryProjects(input: {
  keyword?: string;
}): Promise<Project[]> {
  const all = await listProjects();
  const keyword = input.keyword?.trim() ?? "";
  if (!keyword) {
    return all.items;
  }
  return all.items.filter((item) =>
    [item.name, item.type, item.bidSection, item.siteAddress, item.status, ...item.subcontractNeeds].some(
      (value) => value.includes(keyword),
    ),
  );
}
