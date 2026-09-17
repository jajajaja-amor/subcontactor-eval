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
  workOrderNo: z.string(),
  contractNo: z.string(),
  projectName: z.string(),
  projectId: z.string(),
  productId: z.string(),
  subcontractorId: z.string(),
  userId: z.string(),
  trade: z.string(),
  quantity: z.number(),
  unit: z.string(),
  status: z.enum(["待进场", "施工中", "验收中", "已结算", "已暂停"]),
  progressStatus: z.string(),
  acceptanceStatus: z.string(),
  afterSalesStatus: z.string(),
  amount: z.number(),
  siteAddress: z.string(),
  startAt: z.string(),
  expectedEndAt: z.string(),
  createdAt: z.string(),
});

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum([
    "总包项目经理",
    "现场代表",
    "成本经理",
    "内部客服",
    "分包商联系人",
    "分包项目经理",
  ]),
  party: z.enum(["项目方", "分包商", "内部"]),
  company: z.string(),
  phone: z.string(),
  status: z.enum(["正常", "停用"]),
  subcontractorId: z.string().optional(),
  history: z.array(z.string()),
  preferences: z.array(z.string()),
});

export const returnPolicySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
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
  projectId: z.string().optional(),
  subcontractorId: z.string().optional(),
  channel: z.enum(["电话", "微信", "现场", "邮件"]),
  status: z.enum(["待处理", "处理中", "待人工接管", "已解决", "已关闭"]),
  priority: z.enum(["低", "中", "高", "紧急"]),
  skillId: z.string().optional(),
  assignee: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  summary: z.string(),
});

export const jsonSchemaSchema = z.object({
  type: z.string(),
  properties: z.record(z.string(), z.unknown()).optional(),
  required: z.array(z.string()).optional(),
  additionalProperties: z.boolean().optional(),
});

export const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  model: z.string(),
  temperature: z.number(),
  maxTokens: z.number().int(),
  requiredTools: z.array(z.string()),
  version: z.string(),
  filePath: z.string(),
  status: z.enum(["已发布", "草稿", "已停用"]),
  owner: z.string(),
  trigger: z.string(),
  updatedAt: z.string(),
});

export const toolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  inputSchema: jsonSchemaSchema,
  outputSchema: jsonSchemaSchema,
  sampleInput: z.record(z.string(), z.unknown()),
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
  changeNote: z.string(),
  status: z.enum(["当前", "历史", "回滚候选"]),
  publishedAt: z.string(),
  createdAt: z.string(),
  hash: z.string(),
  filePath: z.string(),
  body: z.string(),
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
  caseIds: z.array(z.string()),
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

export const subcontractorSchema = z.object({
  id: z.string(),
  name: z.string(),
  specialty: z.string(),
  qualificationLevel: z.string(),
  region: z.string(),
  trades: z.array(z.string()),
  quoteMin: z.number(),
  quoteMax: z.number(),
  quoteUnit: z.string(),
  availableSlots: z.array(z.string()),
  performanceScore: z.number(),
  history: z.array(z.string()),
  tags: z.array(z.string()),
  status: z.enum(["可合作", "观察", "暂停", "黑名单"]),
});

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  bidSection: z.string(),
  siteAddress: z.string(),
  startAt: z.string(),
  endAt: z.string(),
  budgetMin: z.number(),
  budgetMax: z.number(),
  subcontractNeeds: z.array(z.string()),
  acceptanceStandard: z.string(),
  status: z.enum(["筹备", "在施", "验收", "已完工", "暂停"]),
});

export const contractSchema = z.object({
  id: z.string(),
  contractNo: z.string(),
  subcontractorId: z.string(),
  projectId: z.string(),
  amount: z.number(),
  pricingMethod: z.string(),
  paymentMilestones: z.array(z.string()),
  warranty: z.string(),
  changes: z.array(
    z.object({
      at: z.string(),
      note: z.string(),
      amountDelta: z.number(),
    }),
  ),
  settlementStatus: z.enum(["未开始", "进度款中", "结算中", "已结清", "争议中"]),
});

export const qualificationSchema = z.object({
  id: z.string(),
  subcontractorId: z.string(),
  type: z.enum([
    "安全生产许可证",
    "特种作业证",
    "保险",
    "税务登记",
    "预警",
    "黑名单",
  ]),
  name: z.string(),
  certNo: z.string(),
  expiresAt: z.string().nullable(),
  status: z.enum(["有效", "即将过期", "过期", "缺失", "预警", "拉黑"]),
  note: z.string(),
});

export const handoffRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  trigger: z.string(),
  action: z.string(),
  enabled: z.boolean(),
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
export const subcontractorsCollectionSchema = collectionSchema(subcontractorSchema);
export const projectsCollectionSchema = collectionSchema(projectSchema);
export const contractsCollectionSchema = collectionSchema(contractSchema);
export const qualificationsCollectionSchema = collectionSchema(qualificationSchema);
export const handoffRulesCollectionSchema = collectionSchema(handoffRuleSchema);
