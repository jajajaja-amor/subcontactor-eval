export type ProductStatus = "可接单" | "暂停接单" | "已下架";
export type ActivityStatus = "进行中" | "未开始" | "已结束";
export type CouponStatus = "可领取" | "已停用" | "已过期";
export type CouponType = "结算折扣" | "进场补贴" | "工期奖励";
export type OrderStatus = "待进场" | "施工中" | "验收中" | "已结算" | "已暂停";
export type UserRole =
  | "总包项目经理"
  | "现场代表"
  | "成本经理"
  | "内部客服"
  | "分包商联系人"
  | "分包项目经理";
export type UserParty = "项目方" | "分包商" | "内部";
export type UserStatus = "正常" | "停用";
export type LogisticsStatus = "待发运" | "在途" | "已进场" | "已签收" | "异常";
export type TicketStatus = "待处理" | "处理中" | "待人工接管" | "已解决" | "已关闭";
export type TicketPriority = "低" | "中" | "高" | "紧急";
export type TicketChannel = "电话" | "微信" | "现场" | "邮件";
export type SkillStatus = "已发布" | "草稿" | "已停用";
export type ToolStatus = "已启用" | "已停用" | "调试中";
export type RiskLevel = "低" | "中" | "高";
export type SkillVersionStatus = "当前" | "历史" | "回滚候选";
export type RunStatus = "成功" | "失败" | "进行中" | "已接管";
export type RunRecordSource = "web" | "demo" | "api" | "retry" | "handoff";
export type RunStepType = "planner" | "validator" | "skill" | "tool" | "risk-check" | "reply";
export type RunStepStatus = "成功" | "失败" | "进行中" | "跳过";
export type MandatoryCapability =
  | "subcontractor-matching"
  | "matching-reason"
  | "quote-reasoning"
  | "price-calculation"
  | "order-query"
  | "logistics-query"
  | "qualification-check"
  | "risk-check"
  | "human-handoff";
export type LlmProviderName = "coze" | "openai-compatible" | "classroom-fixture";
export type PlanRiskLevel = "低" | "中" | "高";
export type ValidationSeverity = "info" | "red" | "block";
export type RatingLabel = "满意" | "一般" | "不满意";
export type ImprovementStatus = "待评估" | "进行中" | "已上线" | "已拒绝";
export type EvalBatchStatus = "待运行" | "运行中" | "已完成" | "失败";
export type AbTestStatus = "进行中" | "已结束" | "草稿";

export type Collection<T> = {
  updatedAt: string;
  items: T[];
};

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  status: ProductStatus;
  leadDays: number;
  coverage: string[];
  description: string;
};

export type Activity = {
  id: string;
  name: string;
  type: string;
  status: ActivityStatus;
  startAt: string;
  endAt: string;
  discountNote: string;
  description: string;
};

export type Coupon = {
  id: string;
  name: string;
  code: string;
  type: CouponType;
  value: number;
  valueUnit: "percent" | "cny";
  status: CouponStatus;
  validFrom: string;
  validTo: string;
  minContractAmount: number;
};

export type Order = {
  id: string;
  workOrderNo: string;
  contractNo: string;
  projectName: string;
  projectId: string;
  productId: string;
  subcontractorId: string;
  userId: string;
  trade: string;
  quantity: number;
  unit: string;
  status: OrderStatus;
  progressStatus: string;
  acceptanceStatus: string;
  afterSalesStatus: string;
  amount: number;
  siteAddress: string;
  startAt: string;
  expectedEndAt: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  role: UserRole;
  party: UserParty;
  company: string;
  phone: string;
  status: UserStatus;
  subcontractorId?: string;
  history: string[];
  preferences: string[];
};

export type ReturnPolicy = {
  id: string;
  name: string;
  category: string;
  appliesTo: string;
  windowHours: number;
  summary: string;
  steps: string[];
};

export type LogisticsRecord = {
  id: string;
  orderId: string;
  material: string;
  carrier: string;
  status: LogisticsStatus;
  eta: string;
  location: string;
  updatedAt: string;
};

export type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
};

export type Ticket = {
  id: string;
  title: string;
  userId: string;
  orderId?: string;
  projectId?: string;
  subcontractorId?: string;
  channel: TicketChannel;
  status: TicketStatus;
  priority: TicketPriority;
  skillId?: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
};

export type JsonSchema = {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  additionalProperties?: boolean;
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  requiredTools: string[];
  version: string;
  filePath: string;
  status: SkillStatus;
  owner: string;
  trigger: string;
  updatedAt: string;
};

export type Tool = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  sampleInput: Record<string, unknown>;
  status: ToolStatus;
  risk: RiskLevel;
  endpoint: string;
};

export type ToolsConfig = {
  timeoutMs: number;
  maxRetries: number;
  allowHumanOverride: boolean;
  sandbox: boolean;
  updatedAt: string;
};

export type SkillVersion = {
  id: string;
  skillId: string;
  version: string;
  changelog: string;
  changeNote: string;
  status: SkillVersionStatus;
  publishedAt: string;
  createdAt: string;
  hash: string;
  filePath: string;
  body: string;
};

export type AgentRun = {
  id: string;
  ticketId: string;
  skillId: string;
  status: RunStatus;
  latencyMs: number;
  startedAt: string;
  model: string;
  summary: string;
};

export type Rating = {
  id: string;
  runId: string;
  score: number;
  label: RatingLabel;
  comment: string;
  createdAt: string;
};

export type Annotation = {
  id: string;
  runId: string;
  author: string;
  issue: string;
  suggestion: string;
  createdAt: string;
};

export type Improvement = {
  id: string;
  title: string;
  status: ImprovementStatus;
  source: string;
  owner: string;
  impact: string;
};

export type EvalCase = {
  id: string;
  name: string;
  skillId: string;
  input: string;
  expected: string;
  tags: string[];
};

export type EvalBatch = {
  id: string;
  name: string;
  status: EvalBatchStatus;
  caseCount: number;
  caseIds: string[];
  passRate: number | null;
  startedAt: string | null;
};

export type AbTest = {
  id: string;
  name: string;
  status: AbTestStatus;
  controlSkillId: string;
  treatmentSkillId: string;
  metric: string;
  trafficPercent: number;
};

export type LlmModelOption = {
  id: string;
  name: string;
  provider: LlmProviderName;
  description: string;
};

export type LlmConfig = {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  fallbackModel: string;
  models: LlmModelOption[];
  updatedAt: string;
};

export type RuntimeFallback = {
  enabled: boolean;
  strategy: string;
  humanTakeoverAfterFailures: number;
  message: string;
  lastProvider?: string;
  lastMode?: string;
  lastSwitchedAt?: string;
  updatedAt: string;
};

export type PlannerConfig = {
  version: string;
  prompt: string;
  allowedSkillIds: string[];
  allowedToolNames: string[];
  extraCapabilities: MandatoryCapability[];
  updatedAt: string;
};

export type StoreTestRecord = {
  counter: number;
  history: number[];
  lastAction: string;
  updatedAt: string;
};

export type Subcontractor = {
  id: string;
  name: string;
  specialty: string;
  qualificationLevel: string;
  region: string;
  trades: string[];
  quoteMin: number;
  quoteMax: number;
  quoteUnit: string;
  availableSlots: string[];
  performanceScore: number;
  history: string[];
  tags: string[];
  status: "可合作" | "观察" | "暂停" | "黑名单";
};

export type Project = {
  id: string;
  name: string;
  type: string;
  bidSection: string;
  siteAddress: string;
  startAt: string;
  endAt: string;
  budgetMin: number;
  budgetMax: number;
  subcontractNeeds: string[];
  acceptanceStandard: string;
  status: "筹备" | "在施" | "验收" | "已完工" | "暂停";
};

export type ContractChange = {
  at: string;
  note: string;
  amountDelta: number;
};

export type Contract = {
  id: string;
  contractNo: string;
  subcontractorId: string;
  projectId: string;
  amount: number;
  pricingMethod: string;
  paymentMilestones: string[];
  warranty: string;
  changes: ContractChange[];
  settlementStatus: "未开始" | "进度款中" | "结算中" | "已结清" | "争议中";
};

export type QualificationRecord = {
  id: string;
  subcontractorId: string;
  type: "安全生产许可证" | "特种作业证" | "保险" | "税务登记" | "预警" | "黑名单";
  name: string;
  certNo: string;
  expiresAt: string | null;
  status: "有效" | "即将过期" | "过期" | "缺失" | "预警" | "拉黑";
  note: string;
};

export type HandoffRule = {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
};

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export type PlanRisk = {
  level: PlanRiskLevel;
  flags: string[];
  requiresHandoff: boolean;
  summary: string;
};

export type PlanDegradation = {
  needed: boolean;
  reason: string;
  handoff: boolean;
};

export type ValidationIssue = {
  code: string;
  message: string;
  severity: ValidationSeverity;
  capability?: MandatoryCapability;
};

export type AgentPlan = {
  selectedSkills: string[];
  selectedTools: string[];
  reasoning: string;
  mandatoryCapabilities: MandatoryCapability[];
  risk: PlanRisk;
  degradation?: PlanDegradation;
  parseFallback?: boolean;
  validationIssues?: ValidationIssue[];
};

export type AgentStep = {
  stepId: string;
  type: RunStepType;
  name: string;
  input: unknown;
  output: unknown;
  durationMs: number;
  status: RunStepStatus;
  error?: string;
};

export type RiskResult = {
  blocked: boolean;
  requiresHandoff: boolean;
  level: PlanRiskLevel;
  reasons: string[];
  rewrittenReply?: string;
  passed: boolean;
};

export type RunRecord = {
  id: string;
  question: string;
  source: RunRecordSource;
  conversationId: string;
  createdAt: string;
  status: RunStatus;
  finalReply: string;
  plan: AgentPlan | null;
  steps: AgentStep[];
  riskResult: RiskResult | null;
  durationMs: number;
  error?: string;
  provider: LlmProviderName;
  model: string;
  skillVersions: Record<string, string>;
  toolVersions: Record<string, string>;
};
