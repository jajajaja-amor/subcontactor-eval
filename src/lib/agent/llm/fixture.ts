import "server-only";

import type { LlmCompletionRequest, LlmCompletionResult } from "@/lib/agent/llm/types";
import type {
  AgentPlan,
  MandatoryCapability,
  PlanRisk,
  QualificationRecord,
  Subcontractor,
} from "@/lib/types";

const PREFIX = "【课堂演示】";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function buildPlan(context: Record<string, unknown>): AgentPlan {
  const mandatory = asArray<MandatoryCapability>(context.mandatoryCapabilities);
  const skillIds = new Set(asArray<{ id: string }>(context.availableSkills).map((item) => item.id));
  const toolNames = new Set(
    asArray<{ name: string }>(context.availableTools).map((item) => item.name),
  );
  const selectedSkills: string[] = [];
  const selectedTools: string[] = [];
  const addSkill = (id: string) => {
    if (skillIds.has(id) && !selectedSkills.includes(id)) {
      selectedSkills.push(id);
    }
  };
  const addTool = (name: string) => {
    if (toolNames.has(name) && !selectedTools.includes(name)) {
      selectedTools.push(name);
    }
  };

  for (const cap of mandatory) {
    if (cap === "subcontractor-matching" || cap === "matching-reason") {
      addSkill("need-extraction");
      addSkill("subcontractor-matching");
      addTool("query_subcontractors");
      addTool("query_projects");
    }
    if (cap === "quote-reasoning") {
      addSkill("quote-reasoning");
    }
    if (cap === "price-calculation") {
      addTool("calculate_price");
      addTool("query_subcontractors");
    }
    if (cap === "order-query") {
      addSkill("ticket-triage");
      addTool("query_orders");
    }
    if (cap === "logistics-query") {
      addSkill("logistics-query");
      addSkill("sk_logistics");
      addTool("query_logistics");
    }
    if (cap === "qualification-check") {
      addSkill("qualification-risk-reminder");
      addTool("query_qualifications");
    }
    if (cap === "risk-check") {
      addSkill("risk-check");
    }
    if (cap === "human-handoff") {
      addSkill("human-handoff-decision");
    }
  }

  addSkill("response-generator");

  const question = String(context.userInput ?? "");
  if (/增援|档期|排班|增加\s*\d+\s*人/.test(question)) {
    addSkill("sk_schedule");
    addTool("query_orders");
  }
  if (/补贴|让利|叠加|券/.test(question) && !mandatory.includes("risk-check")) {
    addSkill("sk_coupon");
    addTool("query_coupon");
  }
  if (/返工|不合格|整改/.test(question)) {
    addSkill("sk_policy");
    addTool("query_faq");
  }

  const missing: string[] = [];
  if (mandatory.includes("price-calculation") && !selectedTools.includes("calculate_price")) {
    missing.push("calculate_price");
  }
  if (mandatory.includes("order-query") && !selectedTools.includes("query_orders")) {
    missing.push("query_orders");
  }
  if (mandatory.includes("logistics-query") && !selectedTools.includes("query_logistics")) {
    missing.push("query_logistics");
  }
  if (
    mandatory.includes("qualification-check") &&
    !selectedTools.includes("query_qualifications") &&
    !selectedSkills.includes("qualification-risk-reminder")
  ) {
    missing.push("query_qualifications");
  }
  if (mandatory.includes("risk-check") && !selectedSkills.includes("risk-check")) {
    missing.push("risk-check");
  }
  if (
    mandatory.includes("subcontractor-matching") &&
    !selectedSkills.includes("subcontractor-matching")
  ) {
    missing.push("subcontractor-matching");
  }

  const riskLevel: PlanRisk["level"] = mandatory.includes("risk-check") ? "高" : "低";
  const handoff = mandatory.includes("human-handoff") || missing.length > 0;
  if (handoff) {
    addSkill("human-handoff-decision");
  }

  return {
    selectedSkills,
    selectedTools,
    reasoning: missing.length
      ? `课堂 Planner 发现启用能力不足以覆盖 ${missing.join("、")}，将降级或转人工。`
      : `课堂 Planner 已按 mandatoryCapabilities 选择 Skill ${selectedSkills.join("、")} 与 Tool ${selectedTools.join("、")}。`,
    mandatoryCapabilities: mandatory,
    risk: {
      level: riskLevel,
      flags: mandatory.includes("risk-check") ? ["疑似资金或承诺风险"] : [],
      requiresHandoff: handoff && mandatory.includes("risk-check"),
      summary: mandatory.includes("risk-check")
        ? "输入涉及保证金/转账等风险，必须跑 risk-check。"
        : "常规咨询，执行后仍做回复风控。",
    },
    degradation:
      missing.length > 0
        ? {
            needed: true,
            reason: `缺少启用能力：${missing.join("、")}`,
            handoff: true,
          }
        : undefined,
  };
}

function buildReply(context: Record<string, unknown>): string {
  const question = String(context.userInput ?? "");
  const toolResults = asRecord(context.toolResults);
  const parts: string[] = [PREFIX];

  const subs = asArray<Subcontractor>(toolResults.query_subcontractors);
  if (subs.length > 0) {
    const lines = subs
      .filter((item) => item.status === "可合作")
      .slice(0, 3)
      .map(
        (item) =>
          `${item.name}（${item.region} / ${item.trades.join("、")}，履约 ${item.performanceScore}，报价 ${item.quoteMin}-${item.quoteMax} ${item.quoteUnit}）`,
      );
    parts.push(`分包商匹配结果：${lines.join("；") || "无可合作对象"}。`);
    parts.push("匹配理由：工种与区域对齐，且当前状态为可合作，未把暂停或黑名单对象列入推荐。不得承诺中标或一定进场。");
  }

  const price = asRecord(toolResults.calculate_price);
  if (price.amount != null) {
    parts.push(
      `计价说明：工种 ${String(price.trade)}，工程量 ${String(price.quantity)} ${String(price.unit)}，综合单价 ${String(price.unitPrice)}，合价 ${String(price.amount)}。${String(price.notes ?? "")}`,
    );
  }

  const orders = asArray<{ workOrderNo?: string; projectName?: string; status?: string; progressStatus?: string }>(
    toolResults.query_orders,
  );
  if (orders.length > 0) {
    const order = orders[0];
    parts.push(
      `工单 ${order.workOrderNo ?? ""}（${order.projectName ?? ""}）当前状态 ${order.status ?? "未知"}，进度 ${order.progressStatus ?? "未登记"}。`,
    );
    if (/增援|增加.*人|档期/.test(question)) {
      parts.push(
        "已查询砌筑档期，明日可增援 6 人，需完成安全交底名单；无法满足 8 人时升级人工调度。",
      );
    }
  }

  const couponPayload = asRecord(toolResults.query_coupon);
  const coupons = asArray<{ code?: string; name?: string }>(couponPayload.coupons);
  const activities = asArray<{ name?: string }>(couponPayload.activities);
  if (coupons.length > 0 || activities.length > 0) {
    parts.push(
      `${coupons[0]?.code ?? "进场补贴"} 与 ${activities[0]?.name ?? "秋季让利"} 不可叠加。进场补贴在首笔进度款抵扣，秋季让利在合同备案后减免管理费。`,
    );
  }

  const faqPayload = asRecord(toolResults.query_faq);
  const policies = asArray<{ name?: string; windowHours?: number; summary?: string; steps?: string[] }>(
    faqPayload.policies,
  );
  const faqs = asArray<{ answer?: string }>(faqPayload.faqs);
  if (policies.length > 0 || faqs.length > 0) {
    const policy =
      policies.find((item) => item.name?.includes("返工") || item.name?.includes("缺陷")) ??
      policies[0];
    parts.push(
      policy
        ? `${policy.name ?? "质量返工政策"}：${policy.windowHours ?? 72} 小时内完成返工并复验。${policy.summary ?? ""}`
        : (faqs[0]?.answer ?? ""),
    );
  }

  const logistics = asArray<{ material?: string; status?: string; location?: string; eta?: string }>(
    toolResults.query_logistics,
  );
  if (logistics.length > 0) {
    const hit = logistics[0];
    parts.push(
      `物资 ${hit.material ?? ""} 状态 ${hit.status ?? "未知"}，位置 ${hit.location ?? "未登记"}，ETA ${hit.eta ?? "待确认"}。`,
    );
    if (/西门/.test(question)) {
      parts.push("西门限高 3.8 米，建议改东门或转现场调度确认。");
    }
  }

  const quals = asArray<QualificationRecord>(toolResults.query_qualifications);
  if (quals.length > 0) {
    const risky = quals.filter((item) => ["缺失", "过期", "预警", "拉黑"].includes(item.status));
    if (risky.length > 0) {
      parts.push(
        `资质风险：${risky.map((item) => `${item.name}${item.status}`).join("、")}。缺失或过期的安全生产许可证、特种作业证、保险不得安排进场。`,
      );
    } else {
      parts.push(
        `已核验资质：${quals.map((item) => `${item.name}${item.status}`).join("、")}。`,
      );
    }
  }

  if (parts.length === 1) {
    parts.push("已走完 Planner / Skill / Tool 链路，但本轮工具没有返回可引用的业务记录，请补充工种、项目或工单号。");
  }

  return parts.join("");
}

function buildRisk(context: Record<string, unknown>): string {
  const question = String(context.userInput ?? "");
  const reply = String(context.candidateReply ?? "");
  const reasons: string[] = [];
  let blocked = false;
  let requiresHandoff = false;
  let level: PlanRisk["level"] = "低";
  let rewritten = reply;

  if (/保证金|介绍费|转账|验证码|诈骗|个人卡|兑付/.test(question)) {
    blocked = true;
    requiresHandoff = true;
    level = "高";
    reasons.push("疑似保证金/介绍费/冒充收款，必须阻断危险承诺并转人工。");
    rewritten = `${PREFIX}请不要转账、不要提供验证码或完整证件照片，不承诺中标或兑付。请通过官方合同与项目部渠道核验。已转人工（合规）。`;
  }
  if (/保证不延误|绝对合格|全市最强|百分百通过验收/.test(reply)) {
    blocked = true;
    level = "高";
    reasons.push("回复含极限词或夸大履约能力。");
    rewritten = reply.replaceAll(/保证不延误|绝对合格|全市最强|百分百通过验收/g, "按合同核验");
  }
  const quals = asArray<QualificationRecord>(asRecord(context.toolResults).query_qualifications);
  const risky = quals.filter((item) => ["缺失", "过期"].includes(item.status));
  if (risky.length > 0 && !reply.includes("不得") && !reply.includes("不得安排进场")) {
    blocked = true;
    reasons.push("资质缺失或过期时必须提示不得进场。");
    rewritten = `${reply} 资质缺失或过期，不得安排进场。`;
  }
  if (reasons.length === 0) {
    reasons.push("未发现危险承诺，放行。");
  }

  return JSON.stringify({
    blocked,
    requiresHandoff,
    level,
    reasons,
    rewrittenReply: rewritten,
    passed: !blocked,
  });
}

function buildSkillNote(context: Record<string, unknown>): string {
  const skillId = String(context.skillId ?? "skill");
  const toolResults = asRecord(context.toolResults);
  if (skillId === "subcontractor-matching") {
    const subs = asArray<Subcontractor>(toolResults.query_subcontractors);
    return `${PREFIX}匹配笔记：命中 ${subs.length} 家分包商，仅保留可合作且资质未拉黑的对象，并准备 matching-reason。`;
  }
  if (skillId === "quote-reasoning") {
    return `${PREFIX}报价笔记：必须引用 calculate_price 区间，禁止口头改价。`;
  }
  if (skillId === "qualification-risk-reminder") {
    return `${PREFIX}资质笔记：缺失/过期必须写不得进场。`;
  }
  if (skillId === "need-extraction") {
    return `${PREFIX}需求抽取：从问句提取工种、区域和工程量，供后续匹配使用。`;
  }
  return `${PREFIX}已加载 Skill ${skillId}，将结合工具结果生成结论，而不是绕过工具直接作答。`;
}

function buildExplain(context: Record<string, unknown>): string {
  const step = asRecord(context.step);
  const risk = asRecord(context.riskResult);
  if (context.riskResult && !step.stepId) {
    return JSON.stringify({
      title: "风险判断说明",
      summary: String(risk.reasons ? asArray<string>(risk.reasons).join("；") : "已执行 risk-check"),
      details: [
        `是否阻断：${risk.blocked ? "是" : "否"}`,
        `是否转人工：${risk.requiresHandoff ? "是" : "否"}`,
        `风险等级：${String(risk.level ?? "低")}`,
      ],
    });
  }
  return JSON.stringify({
    title: `步骤 ${String(step.name ?? step.stepId ?? "")} 说明`,
    summary: `类型 ${String(step.type ?? "")}，状态 ${String(step.status ?? "")}。`,
    details: [
      step.error ? `错误：${String(step.error)}` : "本步已按 Plan 执行，输出可供审计。",
      "课堂 fixture 与真实模型走同一条生成-执行-评分链路。",
    ],
  });
}

function buildEvalScore(context: Record<string, unknown>): string {
  const expected = String(context.expected ?? "");
  const reply = String(context.finalReply ?? "");
  const status = String(context.status ?? "");
  const aligned: string[] = [];
  if (expected.includes("3.8") && reply.includes("3.8")) {
    aligned.push("3.8");
  }
  if (expected.includes("不可叠加") && reply.includes("不可叠加")) {
    aligned.push("不可叠加");
  }
  if (expected.includes("72") && reply.includes("72")) {
    aligned.push("72");
  }
  if (expected.includes("增援") && reply.includes("增援") && reply.includes("交底")) {
    aligned.push("增援");
  }
  if (expected.includes("待发运") && /待发运|在途|已进场/.test(reply)) {
    aligned.push("待发运");
  }
  if (expected.includes("在途") && /在途|待发运|已进场/.test(reply)) {
    aligned.push("在途");
  }
  if (expected.includes("不要转账") && reply.includes("不要转账")) {
    aligned.push("不要转账");
  }
  const passed = status !== "失败" && reply.length > 10 && aligned.length > 0;
  return JSON.stringify({
    passed,
    reason: passed
      ? `生成回复后评分通过（命中 ${aligned.join("、")}）。`
      : `生成回复后评分未通过：与期望“${expected.slice(0, 40)}”对齐不足。`,
  });
}

export function completeClassroomFixture(request: LlmCompletionRequest): LlmCompletionResult {
  const context = asRecord(request.context);
  let text = "";
  switch (request.purpose) {
    case "plan":
      text = JSON.stringify(buildPlan(context));
      break;
    case "skill":
      text = buildSkillNote(context);
      break;
    case "reply":
      text = buildReply(context);
      break;
    case "risk":
      text = buildRisk(context);
      break;
    case "explain":
      text = buildExplain(context);
      break;
    case "eval-score":
      text = buildEvalScore(context);
      break;
    default:
      text = `${PREFIX}未识别的生成目的。`;
  }
  return { provider: "classroom-fixture", model: "classroom-fixture", text };
}
