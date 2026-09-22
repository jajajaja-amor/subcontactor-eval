import "server-only";

import {
  listContracts,
  listLogistics,
  listOrders,
  listProducts,
  listProjects,
  listQualifications,
  listSubcontractors,
  listUsers,
} from "@/lib/catalog-repo";
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
  listTools,
} from "@/lib/ops-repo";
import { listRunRecords } from "@/lib/agent/run-records";
import { readSkillFile } from "@/lib/skill-files";
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
    subcontractors,
    projects,
    contracts,
    qualifications,
    logistics,
    tools,
    runRecords,
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
    listSubcontractors(),
    listProjects(),
    listContracts(),
    listQualifications(),
    listLogistics(),
    listTools(),
    listRunRecords(),
  ]);

  const userIds = new Set(users.items.map((item) => item.id));
  const productIds = new Set(products.items.map((item) => item.id));
  const orderIds = new Set(orders.items.map((item) => item.id));
  const ticketIds = new Set(tickets.items.map((item) => item.id));
  const skillIds = new Set(skills.items.map((item) => item.id));
  const runIds = new Set([
    ...runs.items.map((item) => item.id),
    ...runRecords.items.map((item) => item.id),
  ]);
  const caseIds = new Set(cases.items.map((item) => item.id));
  const subcontractorIds = new Set(subcontractors.items.map((item) => item.id));
  const projectIds = new Set(projects.items.map((item) => item.id));
  const toolNames = new Set(tools.items.map((item) => item.name));

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
    if (!subcontractorIds.has(order.subcontractorId)) {
      issues.push({
        code: "dangling_subcontractor",
        message: `工单 ${order.id} 引用了不存在的分包商 ${order.subcontractorId}`,
      });
    }
    if (!projectIds.has(order.projectId)) {
      issues.push({
        code: "dangling_project",
        message: `工单 ${order.id} 引用了不存在的项目 ${order.projectId}`,
      });
    }
  }

  for (const user of users.items) {
    if (user.subcontractorId && !subcontractorIds.has(user.subcontractorId)) {
      issues.push({
        code: "dangling_subcontractor",
        message: `用户 ${user.id} 引用了不存在的分包商 ${user.subcontractorId}`,
      });
    }
  }

  for (const contract of contracts.items) {
    if (!subcontractorIds.has(contract.subcontractorId)) {
      issues.push({
        code: "dangling_subcontractor",
        message: `合同 ${contract.contractNo} 引用了不存在的分包商 ${contract.subcontractorId}`,
      });
    }
    if (!projectIds.has(contract.projectId)) {
      issues.push({
        code: "dangling_project",
        message: `合同 ${contract.contractNo} 引用了不存在的项目 ${contract.projectId}`,
      });
    }
  }

  for (const qualification of qualifications.items) {
    if (!subcontractorIds.has(qualification.subcontractorId)) {
      issues.push({
        code: "dangling_subcontractor",
        message: `资质 ${qualification.id} 引用了不存在的分包商 ${qualification.subcontractorId}`,
      });
    }
  }

  for (const record of logistics.items) {
    if (!orderIds.has(record.orderId)) {
      issues.push({
        code: "dangling_order",
        message: `物流 ${record.id} 引用了不存在的工单 ${record.orderId}`,
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
    if (ticket.projectId && !projectIds.has(ticket.projectId)) {
      issues.push({
        code: "dangling_project",
        message: `工单 ${ticket.id} 引用了不存在的项目 ${ticket.projectId}`,
      });
    }
    if (ticket.subcontractorId && !subcontractorIds.has(ticket.subcontractorId)) {
      issues.push({
        code: "dangling_subcontractor",
        message: `工单 ${ticket.id} 引用了不存在的分包商 ${ticket.subcontractorId}`,
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

  for (const skill of skills.items) {
    try {
      await readSkillFile(skill.filePath);
    } catch {
      issues.push({
        code: "missing_skill_file",
        message: `Skill ${skill.id} 的文件 ${skill.filePath} 无法读取`,
      });
    }
    for (const toolName of skill.requiredTools) {
      if (!toolNames.has(toolName)) {
        issues.push({
          code: "dangling_tool",
          message: `Skill ${skill.id} 依赖未注册的 Tool ${toolName}`,
        });
      }
    }
  }

  return { ok: issues.length === 0, files, issues };
}
