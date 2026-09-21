import "server-only";

import {
  listContracts,
  listOrders,
  listProjects,
  listSubcontractors,
  listUsers,
} from "@/lib/catalog-repo";
import {
  getLlmConfig,
  getRuntimeFallback,
  listRatings,
  listRuns,
  listSkills,
  listTickets,
  listTools,
} from "@/lib/ops-repo";
import type { AgentRun, Ticket } from "@/lib/types";

export type TicketVolumePoint = {
  date: string;
  label: string;
  count: number;
};

export type OverviewData = {
  openTickets: number;
  takeoverTickets: number;
  todayRuns: number;
  publishedSkills: number;
  enabledTools: number;
  averageScore: number | null;
  llmModel: string;
  fallbackEnabled: boolean;
  recentTickets: Ticket[];
  recentRuns: AgentRun[];
  volume: TicketVolumePoint[];
  users: number;
  orders: number;
  subcontractors: number;
  projects: number;
  contracts: number;
};

function startOfDay(iso: string): string {
  return iso.slice(0, 10);
}

function formatLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export async function getOverviewData(): Promise<OverviewData> {
  const [
    tickets,
    runs,
    skills,
    tools,
    ratings,
    llm,
    fallback,
    users,
    orders,
    subcontractors,
    projects,
    contracts,
  ] = await Promise.all([
    listTickets(),
    listRuns(),
    listSkills(),
    listTools(),
    listRatings(),
    getLlmConfig(),
    getRuntimeFallback(),
    listUsers(),
    listOrders(),
    listSubcontractors(),
    listProjects(),
    listContracts(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const openStatuses = new Set(["待处理", "处理中", "待人工接管"]);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });

  const volume = days.map((date) => ({
    date,
    label: formatLabel(date),
    count: tickets.items.filter((ticket) => startOfDay(ticket.createdAt) === date)
      .length,
  }));

  const averageScore =
    ratings.items.length === 0
      ? null
      : Number(
          (
            ratings.items.reduce((sum, item) => sum + item.score, 0) /
            ratings.items.length
          ).toFixed(1),
        );

  return {
    openTickets: tickets.items.filter((ticket) => openStatuses.has(ticket.status))
      .length,
    takeoverTickets: tickets.items.filter((ticket) => ticket.status === "待人工接管")
      .length,
    todayRuns: runs.items.filter((run) => startOfDay(run.startedAt) === today)
      .length,
    publishedSkills: skills.items.filter((skill) => skill.enabled).length,
    enabledTools: tools.items.filter((tool) => tool.enabled).length,
    averageScore,
    llmModel: llm.model,
    fallbackEnabled: fallback.enabled,
    recentTickets: [...tickets.items]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 5),
    recentRuns: [...runs.items]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 5),
    volume,
    users: users.items.length,
    orders: orders.items.length,
    subcontractors: subcontractors.items.length,
    projects: projects.items.length,
    contracts: contracts.items.length,
  };
}
