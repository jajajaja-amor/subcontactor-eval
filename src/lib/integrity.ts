import "server-only";

import { listOrders, listProducts, listUsers } from "@/lib/catalog-repo";
import { REQUIRED_DATA_FILES } from "@/lib/data-files";
import {
  listAbTests,
  listAnnotations,
  listEvalBatches,
  listEvalCases,
  listRatings,
  listRuns,
  listSkillVersions,
  listSkills,
  listTickets,
} from "@/lib/ops-repo";
import { inspectDataFile } from "@/lib/store";

export type IntegrityIssue = {
  code: string;
  message: string;
};

export async function checkDataIntegrity(): Promise<{
  ok: boolean;
  files: { file: string; exists: boolean; size: number }[];
  issues: IntegrityIssue[];
}> {
  const files = await Promise.all(
    REQUIRED_DATA_FILES.map(async (file) => {
      const info = await inspectDataFile(file);
      return { file, exists: info.exists, size: info.size };
    }),
  );

  const issues: IntegrityIssue[] = files
    .filter((file) => !file.exists)
    .map((file) => ({
      code: "missing_file",
      message: `缺少数据文件 ${file.file}`,
    }));

  if (issues.length > 0) {
    return { ok: false, files, issues };
  }

  const [
    users,
    products,
    orders,
    tickets,
    skills,
    versions,
    runs,
    ratings,
    annotations,
    cases,
    batches,
    abTests,
  ] = await Promise.all([
    listUsers(),
    listProducts(),
    listOrders(),
    listTickets(),
    listSkills(),
    listSkillVersions(),
    listRuns(),
    listRatings(),
    listAnnotations(),
    listEvalCases(),
    listEvalBatches(),
    listAbTests(),
  ]);

  const userIds = new Set(users.items.map((item) => item.id));
  const productIds = new Set(products.items.map((item) => item.id));
  const orderIds = new Set(orders.items.map((item) => item.id));
  const ticketIds = new Set(tickets.items.map((item) => item.id));
  const skillIds = new Set(skills.items.map((item) => item.id));
  const runIds = new Set(runs.items.map((item) => item.id));
  const caseIds = new Set(cases.items.map((item) => item.id));

  for (const order of orders.items) {
    if (!productIds.has(order.productId)) {
      issues.push({
        code: "dangling_product",
        message: `合同 ${order.id} 引用了不存在的分包目录 ${order.productId}`,
      });
    }
    if (!userIds.has(order.userId)) {
      issues.push({
        code: "dangling_user",
        message: `合同 ${order.id} 引用了不存在的用户 ${order.userId}`,
      });
    }
  }

  for (const ticket of tickets.items) {
    if (!userIds.has(ticket.userId)) {
      issues.push({
        code: "dangling_user",
        message: `工单 ${ticket.id} 引用了不存在的用户 ${ticket.userId}`,
      });
    }
    if (ticket.orderId && !orderIds.has(ticket.orderId)) {
      issues.push({
        code: "dangling_order",
        message: `工单 ${ticket.id} 引用了不存在的合同 ${ticket.orderId}`,
      });
    }
    if (ticket.skillId && !skillIds.has(ticket.skillId)) {
      issues.push({
        code: "dangling_skill",
        message: `工单 ${ticket.id} 引用了不存在的 Skill ${ticket.skillId}`,
      });
    }
  }

  for (const version of versions.items) {
    if (!skillIds.has(version.skillId)) {
      issues.push({
        code: "dangling_skill",
        message: `版本 ${version.id} 引用了不存在的 Skill ${version.skillId}`,
      });
    }
  }

  for (const run of runs.items) {
    if (!ticketIds.has(run.ticketId)) {
      issues.push({
        code: "dangling_ticket",
        message: `运行 ${run.id} 引用了不存在的工单 ${run.ticketId}`,
      });
    }
    if (!skillIds.has(run.skillId)) {
      issues.push({
        code: "dangling_skill",
        message: `运行 ${run.id} 引用了不存在的 Skill ${run.skillId}`,
      });
    }
  }

  for (const rating of ratings.items) {
    if (!runIds.has(rating.runId)) {
      issues.push({
        code: "dangling_run",
        message: `评分 ${rating.id} 引用了不存在的运行 ${rating.runId}`,
      });
    }
  }

  for (const annotation of annotations.items) {
    if (!runIds.has(annotation.runId)) {
      issues.push({
        code: "dangling_run",
        message: `标注 ${annotation.id} 引用了不存在的运行 ${annotation.runId}`,
      });
    }
  }

  for (const evalCase of cases.items) {
    if (!skillIds.has(evalCase.skillId)) {
      issues.push({
        code: "dangling_skill",
        message: `评测用例 ${evalCase.id} 引用了不存在的 Skill ${evalCase.skillId}`,
      });
    }
  }

  for (const batch of batches.items) {
    if (batch.caseIds.length !== batch.caseCount) {
      issues.push({
        code: "case_count_mismatch",
        message: `评测批次 ${batch.id} 的 caseCount=${batch.caseCount} 与 caseIds=${batch.caseIds.length} 不一致`,
      });
    }
    for (const caseId of batch.caseIds) {
      if (!caseIds.has(caseId)) {
        issues.push({
          code: "dangling_case",
          message: `评测批次 ${batch.id} 引用了不存在的用例 ${caseId}`,
        });
      }
    }
  }

  for (const test of abTests.items) {
    if (!skillIds.has(test.controlSkillId) || !skillIds.has(test.treatmentSkillId)) {
      issues.push({
        code: "dangling_skill",
        message: `A/B ${test.id} 引用了不存在的 Skill`,
      });
    }
  }

  return { ok: issues.length === 0, files, issues };
}
