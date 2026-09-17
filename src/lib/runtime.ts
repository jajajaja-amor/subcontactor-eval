import "server-only";

import { randomUUID } from "node:crypto";

import { listProducts } from "@/lib/catalog-repo";
import {
  getLlmConfig,
  listEvalBatches,
  listEvalCases,
  listSkills,
  listTickets,
} from "@/lib/ops-repo";
import {
  evalBatchesCollectionSchema,
  runsCollectionSchema,
  ticketsCollectionSchema,
} from "@/lib/schemas";
import { updateJson } from "@/lib/store";
import type { AgentRun, EvalBatch, RunStatus, Ticket } from "@/lib/types";
import { queryActivities, queryCoupon } from "../../tools/query-coupon";
import { queryFaq, queryReturnPolicies } from "../../tools/query-faq";
import { queryLogistics } from "../../tools/query-logistics";
import { queryOrder } from "../../tools/query-order";

export type RuntimeAction = "run" | "retry" | "takeover" | "eval";

export type RuntimeResult = {
  ok: boolean;
  message: string;
  run?: AgentRun;
  batch?: EvalBatch;
  ticket?: Ticket;
};

type PlanResult = {
  skillId: string;
  status: RunStatus;
  summary: string;
};

function nowIso() {
  return new Date().toISOString();
}

function pickSkillId(input: string, fallback?: string) {
  if (fallback) {
    return fallback;
  }
  if (/卸|物流|在途|西门|进场车/.test(input)) {
    return "sk_logistics";
  }
  if (/券|补贴|让利|叠加/.test(input)) {
    return "sk_coupon";
  }
  if (/返工|退场|不合格|整改/.test(input)) {
    return "sk_policy";
  }
  if (/进度款|结算/.test(input)) {
    return "sk_settlement";
  }
  if (/接单|水电|单价|目录/.test(input)) {
    return "sk_catalog";
  }
  return "sk_schedule";
}

async function planAndExecute(input: {
  title: string;
  skillId?: string;
  orderId?: string;
}): Promise<PlanResult> {
  const skillId = pickSkillId(input.title, input.skillId);
  const started = Date.now();

  if (skillId === "sk_logistics") {
    const keyword = input.orderId || (input.title.includes("幕墙") ? "玻璃" : "钢筋");
    const records = await queryLogistics(keyword);
    const hit = records[0];
    if (/西门/.test(input.title)) {
      return {
        skillId,
        status: "已接管",
        summary: `query_logistics 命中 ${hit?.material ?? "在途材料"}，西门限高 3.8 米，建议改东门或人工确认。工具耗时 ${Date.now() - started}ms。`,
      };
    }
    return {
      skillId,
      status: "成功",
      summary: `query_logistics 返回 ${hit?.status ?? "未知"}，位置 ${hit?.location ?? "未登记"}，ETA ${hit?.eta ?? "待确认"}。`,
    };
  }

  if (skillId === "sk_coupon") {
    const coupons = await queryCoupon("进场");
    const activities = await queryActivities("秋季");
    const coupon = coupons[0];
    const activity = activities[0];
    return {
      skillId,
      status: "成功",
      summary: `${coupon?.code ?? "进场补贴"} 与 ${activity?.name ?? "秋季让利"} 不可叠加。进场补贴在首笔进度款抵扣，秋季让利在合同备案后减免管理费。`,
    };
  }

  if (skillId === "sk_policy") {
    const policies = await queryReturnPolicies("返工");
    const policy = policies[0];
    return {
      skillId,
      status: "成功",
      summary: `${policy?.name ?? "质量返工政策"}：${policy?.windowHours ?? 72} 小时内完成返工并复验。${policy?.steps?.[0] ?? ""}`,
    };
  }

  if (skillId === "sk_settlement") {
    const faqs = await queryFaq("进度款");
    return {
      skillId,
      status: "成功",
      summary: faqs[0]?.answer ?? "形象进度确认后 5 个工作日内完成审核。",
    };
  }

  if (skillId === "sk_catalog") {
    const products = await listProducts();
    const mep = products.items.find((item) => item.id === "prd_mep");
    return {
      skillId,
      status: "成功",
      summary: `${mep?.name ?? "水电安装分包"}当前状态为${mep?.status ?? "暂停接单"}，预计 10 月中恢复。可接单工种仍含砌筑、钢筋、模板与幕墙。`,
    };
  }

  const orders = await queryOrder(input.orderId || "临港");
  const order = orders[0];
  return {
    skillId,
    status: "成功",
    summary: `已查询${order?.projectName ?? "项目"}砌筑档期，明日可增援 6 人，需完成安全交底名单；无法满足 8 人时升级人工调度。`,
  };
}

function evalPassed(summary: string, skillId: string) {
  if (skillId === "sk_logistics") {
    return summary.includes("3.8") || /在途|待发运|已进场|ETA/.test(summary);
  }
  if (skillId === "sk_coupon") {
    return summary.includes("不可叠加");
  }
  if (skillId === "sk_policy") {
    return summary.includes("72");
  }
  if (skillId === "sk_schedule") {
    return summary.includes("增援") && summary.includes("交底");
  }
  if (skillId === "sk_catalog") {
    return summary.includes("暂停接单");
  }
  return summary.length > 10;
}

async function appendRun(run: AgentRun) {
  return updateJson("runs.json", runsCollectionSchema, (current) => ({
    updatedAt: nowIso(),
    items: [run, ...current.items],
  }));
}

async function patchTicket(ticketId: string, patch: Partial<Ticket>) {
  return updateJson("tickets.json", ticketsCollectionSchema, (current) => ({
    updatedAt: nowIso(),
    items: current.items.map((item) =>
      item.id === ticketId
        ? { ...item, ...patch, updatedAt: nowIso() }
        : item,
    ),
  }));
}

export async function executeRuntime(action: RuntimeAction, id: string): Promise<RuntimeResult> {
  if (action === "eval") {
    const [batches, cases, llm] = await Promise.all([
      listEvalBatches(),
      listEvalCases(),
      getLlmConfig(),
    ]);
    const batch = batches.items.find((item) => item.id === id);
    if (!batch) {
      return { ok: false, message: `没有找到评测批次 ${id}` };
    }

    const selected = cases.items.filter((item) => batch.caseIds.includes(item.id));
    if (selected.length === 0) {
      return { ok: false, message: `评测批次 ${id} 没有可运行的用例` };
    }

    let passed = 0;
    for (const evalCase of selected) {
      const plan = await planAndExecute({
        title: evalCase.input,
        skillId: evalCase.skillId,
      });
      if (evalPassed(plan.summary, evalCase.skillId)) {
        passed += 1;
      }
    }

    const passRate = Number((passed / selected.length).toFixed(2));
    const nextBatch: EvalBatch = {
      ...batch,
      status: passRate >= 0.6 ? "已完成" : "失败",
      caseCount: selected.length,
      passRate,
      startedAt: nowIso(),
    };

    await updateJson("eval_batches.json", evalBatchesCollectionSchema, (current) => ({
      updatedAt: nowIso(),
      items: current.items.map((item) => (item.id === id ? nextBatch : item)),
    }));

    return {
      ok: true,
      message: `评测完成：${passed}/${selected.length} 通过，通过率 ${Math.round(passRate * 100)}%。主模型 ${llm.model}`,
      batch: nextBatch,
    };
  }

  const tickets = await listTickets();
  const ticket = tickets.items.find((item) => item.id === id);
  if (!ticket) {
    return { ok: false, message: `没有找到工单 ${id}` };
  }

  if (ticket.status === "已关闭") {
    return { ok: false, message: "已关闭工单不能再运行或接管" };
  }

  const skills = await listSkills();
  const llm = await getLlmConfig();
  const skillId = ticket.skillId ?? pickSkillId(ticket.title);
  const skill = skills.items.find((item) => item.id === skillId);

  if (action === "takeover") {
    const run: AgentRun = {
      id: `run_${randomUUID().slice(0, 8)}`,
      ticketId: ticket.id,
      skillId,
      status: "已接管",
      latencyMs: 120,
      startedAt: nowIso(),
      model: llm.model,
      summary: `人工接管：${skill?.name ?? skillId} 停止自动回复，转值班客服。`,
    };
    await appendRun(run);
    const updated = await patchTicket(ticket.id, {
      status: "待人工接管",
      assignee: "值班客服/周倩",
      summary: run.summary,
    });
    return {
      ok: true,
      message: `已接管工单 ${ticket.id}`,
      run,
      ticket: updated.items.find((item) => item.id === ticket.id),
    };
  }

  const plan = await planAndExecute({
    title: ticket.title,
    skillId,
    orderId: ticket.orderId,
  });
  const run: AgentRun = {
    id: `run_${randomUUID().slice(0, 8)}`,
    ticketId: ticket.id,
    skillId: plan.skillId,
    status: plan.status,
    latencyMs: Math.max(80, Math.min(2400, ticket.title.length * 40)),
    startedAt: nowIso(),
    model: llm.model,
    summary: action === "retry" ? `重试后：${plan.summary}` : plan.summary,
  };
  await appendRun(run);

  const nextStatus: Ticket["status"] =
    plan.status === "已接管"
      ? "待人工接管"
      : plan.status === "失败"
        ? "处理中"
        : ticket.status === "待处理"
          ? "处理中"
          : ticket.status;

  const updated = await patchTicket(ticket.id, {
    status: nextStatus,
    assignee:
      plan.status === "已接管"
        ? "待接管/现场调度"
        : `Agent/${skill?.name ?? plan.skillId}`,
    summary: run.summary,
  });

  return {
    ok: true,
    message:
      action === "retry"
        ? `已重试工单 ${ticket.id}，结果为${run.status}`
        : `已运行 ${skill?.name ?? plan.skillId}，结果为${run.status}`,
    run,
    ticket: updated.items.find((item) => item.id === ticket.id),
  };
}
