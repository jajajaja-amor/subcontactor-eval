import { z } from "zod";

export const collectionSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    updatedAt: z.string(),
    items: z.array(itemSchema),
  });

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  unit: z.string(),
  unitPrice: z.number(),
  status: z.enum(["可接单", "暂停接单", "已下架"]),
  leadDays: z.number().int(),
  coverage: z.array(z.string()),
  description: z.string(),
});

export const activitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.enum(["进行中", "未开始", "已结束"]),
  startAt: z.string(),
  endAt: z.string(),
  discountNote: z.string(),
  description: z.string(),
});

export const couponSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.enum(["结算折扣", "进场补贴", "工期奖励"]),
  value: z.number(),
  valueUnit: z.enum(["percent", "cny"]),
  status: z.enum(["可领取", "已停用", "已过期"]),
  validFrom: z.string(),
  validTo: z.string(),
  minContractAmount: z.number(),
});

export const orderSchema = z.object({
  id: z.string(),
  contractNo: z.string(),
  projectName: z.string(),
  productId: z.string(),
  userId: z.string(),
  status: z.enum(["待进场", "施工中", "验收中", "已结算", "已暂停"]),
  amount: z.number(),
  siteAddress: z.string(),
  startAt: z.string(),
  expectedEndAt: z.string(),
  createdAt: z.string(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(["总包项目经理", "现场代表", "成本经理", "内部客服"]),
  company: z.string(),
  phone: z.string(),
  status: z.enum(["正常", "停用"]),
});

export const returnPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  appliesTo: z.string(),
  windowHours: z.number().int(),
  summary: z.string(),
  steps: z.array(z.string()),
});

export const logisticsSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  material: z.string(),
  carrier: z.string(),
  status: z.enum(["待发运", "在途", "已进场", "已签收", "异常"]),
  eta: z.string(),
  location: z.string(),
  updatedAt: z.string(),
});

export const faqSchema = z.object({
  id: z.string(),
  category: z.string(),
  question: z.string(),
  answer: z.string(),
  tags: z.array(z.string()),
});

export const ticketSchema = z.object({
  id: z.string(),
  title: z.string(),
  userId: z.string(),
  orderId: z.string().optional(),
  channel: z.enum(["电话", "微信", "现场", "邮件"]),
  status: z.enum(["待处理", "处理中", "待人工接管", "已解决", "已关闭"]),
  priority: z.enum(["低", "中", "高", "紧急"]),
  skillId: z.string().optional(),
  assignee: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  summary: z.string(),
});

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(["已发布", "草稿", "已停用"]),
  version: z.string(),
  owner: z.string(),
  trigger: z.string(),
  updatedAt: z.string(),
});

export const toolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.enum(["已启用", "已停用", "调试中"]),
  risk: z.enum(["低", "中", "高"]),
  endpoint: z.string(),
});

export const toolsConfigSchema = z.object({
  timeoutMs: z.number().int(),
  maxRetries: z.number().int(),
  allowHumanOverride: z.boolean(),
  sandbox: z.boolean(),
  updatedAt: z.string(),
});

export const skillVersionSchema = z.object({
  id: z.string(),
  skillId: z.string(),
  version: z.string(),
  changelog: z.string(),
  status: z.enum(["当前", "历史", "回滚候选"]),
  publishedAt: z.string(),
});

export const agentRunSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  skillId: z.string(),
  status: z.enum(["成功", "失败", "进行中", "已接管"]),
  latencyMs: z.number().int(),
  startedAt: z.string(),
  model: z.string(),
  summary: z.string(),
});

export const ratingSchema = z.object({
  id: z.string(),
  runId: z.string(),
  score: z.number(),
  label: z.enum(["满意", "一般", "不满意"]),
  comment: z.string(),
  createdAt: z.string(),
});

export const annotationSchema = z.object({
  id: z.string(),
  runId: z.string(),
  author: z.string(),
  issue: z.string(),
  suggestion: z.string(),
  createdAt: z.string(),
});

export const improvementSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(["待评估", "进行中", "已上线", "已拒绝"]),
  source: z.string(),
  owner: z.string(),
  impact: z.string(),
});

export const evalCaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  skillId: z.string(),
  input: z.string(),
  expected: z.string(),
  tags: z.array(z.string()),
});

export const evalBatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["待运行", "运行中", "已完成", "失败"]),
  caseCount: z.number().int(),
  passRate: z.number().nullable(),
  startedAt: z.string().nullable(),
});

export const abTestSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["进行中", "已结束", "草稿"]),
  controlSkillId: z.string(),
  treatmentSkillId: z.string(),
  metric: z.string(),
  trafficPercent: z.number(),
});

export const llmConfigSchema = z.object({
  provider: z.string(),
  model: z.string(),
  temperature: z.number(),
  maxTokens: z.number().int(),
  fallbackModel: z.string(),
  updatedAt: z.string(),
});

export const runtimeFallbackSchema = z.object({
  enabled: z.boolean(),
  strategy: z.string(),
  humanTakeoverAfterFailures: z.number().int(),
  message: z.string(),
  updatedAt: z.string(),
});

export const storeTestRecordSchema = z.object({
  counter: z.number().int(),
  history: z.array(z.number().int()),
  lastAction: z.string(),
  updatedAt: z.string(),
});

export const productsCollectionSchema = collectionSchema(productSchema);
export const activitiesCollectionSchema = collectionSchema(activitySchema);
export const couponsCollectionSchema = collectionSchema(couponSchema);
export const ordersCollectionSchema = collectionSchema(orderSchema);
export const usersCollectionSchema = collectionSchema(userSchema);
export const returnPoliciesCollectionSchema = collectionSchema(returnPolicySchema);
export const logisticsCollectionSchema = collectionSchema(logisticsSchema);
export const faqCollectionSchema = collectionSchema(faqSchema);
export const ticketsCollectionSchema = collectionSchema(ticketSchema);
export const skillsCollectionSchema = collectionSchema(skillSchema);
export const toolsCollectionSchema = collectionSchema(toolSchema);
export const skillVersionsCollectionSchema = collectionSchema(skillVersionSchema);
export const runsCollectionSchema = collectionSchema(agentRunSchema);
export const ratingsCollectionSchema = collectionSchema(ratingSchema);
export const annotationsCollectionSchema = collectionSchema(annotationSchema);
export const improvementsCollectionSchema = collectionSchema(improvementSchema);
export const evalCasesCollectionSchema = collectionSchema(evalCaseSchema);
export const evalBatchesCollectionSchema = collectionSchema(evalBatchSchema);
export const abTestsCollectionSchema = collectionSchema(abTestSchema);
