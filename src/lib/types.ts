export type ProductStatus = "可接单" | "暂停接单" | "已下架";
export type ActivityStatus = "进行中" | "未开始" | "已结束";
export type CouponStatus = "可领取" | "已停用" | "已过期";
export type CouponType = "结算折扣" | "进场补贴" | "工期奖励";
export type OrderStatus = "待进场" | "施工中" | "验收中" | "已结算" | "已暂停";
export type UserRole = "总包项目经理" | "现场代表" | "成本经理" | "内部客服";
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
  contractNo: string;
  projectName: string;
  productId: string;
  userId: string;
  status: OrderStatus;
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
  company: string;
  phone: string;
  status: UserStatus;
};

export type ReturnPolicy = {
  id: string;
  name: string;
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
  channel: TicketChannel;
  status: TicketStatus;
  priority: TicketPriority;
  skillId?: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  summary: string;
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  status: SkillStatus;
  version: string;
  owner: string;
  trigger: string;
  updatedAt: string;
};

export type Tool = {
  id: string;
  name: string;
  description: string;
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
  status: SkillVersionStatus;
  publishedAt: string;
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

export type LlmConfig = {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  fallbackModel: string;
  updatedAt: string;
};

export type RuntimeFallback = {
  enabled: boolean;
  strategy: string;
  humanTakeoverAfterFailures: number;
  message: string;
  updatedAt: string;
};

export type StoreTestRecord = {
  counter: number;
  history: number[];
  lastAction: string;
  updatedAt: string;
};
