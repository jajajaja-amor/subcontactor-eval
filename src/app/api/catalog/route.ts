import { NextResponse } from "next/server";

import {
  listContracts,
  listFaqs,
  listHandoffRules,
  listLogistics,
  listOrders,
  listProjects,
  listQualifications,
  listReturnPolicies,
  listSubcontractors,
  listUsers,
} from "@/lib/catalog-repo";
import { listTickets } from "@/lib/ops-repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") ?? "all";

  const [
    subcontractors,
    projects,
    contracts,
    orders,
    users,
    policies,
    faqs,
    logistics,
    qualifications,
    tickets,
    handoff,
  ] = await Promise.all([
    listSubcontractors(),
    listProjects(),
    listContracts(),
    listOrders(),
    listUsers(),
    listReturnPolicies(),
    listFaqs(),
    listLogistics(),
    listQualifications(),
    listTickets(),
    listHandoffRules(),
  ]);

  const catalog = {
    subcontractors: subcontractors.items,
    projects: projects.items,
    contracts: contracts.items,
    orders: orders.items,
    users: users.items,
    policies: policies.items,
    faqs: faqs.items,
    logistics: logistics.items,
    qualifications: qualifications.items,
    tickets: tickets.items,
    handoffRules: handoff.items,
  };

  if (type !== "all" && type in catalog) {
    return NextResponse.json({
      ok: true,
      type,
      items: catalog[type as keyof typeof catalog],
    });
  }

  return NextResponse.json({
    ok: true,
    type: "all",
    counts: Object.fromEntries(
      Object.entries(catalog).map(([key, items]) => [key, items.length]),
    ),
    catalog,
  });
}
