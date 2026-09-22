import "server-only";

export type ParsedToolArgs = Record<string, unknown>;

const TRADES = ["砌筑", "钢筋", "模板", "水电", "幕墙", "高空", "焊接", "铝模", "木模"] as const;

export function extractTrade(text: string): string {
  return TRADES.find((item) => text.includes(item)) ?? "";
}

export function extractQuantity(text: string): number | undefined {
  const withUnit = text.match(/(\d+(?:\.\d+)?)\s*(立方米|吨|平方米|平方|平米|台|人|车)/);
  if (withUnit) {
    return Number(withUnit[1]);
  }
  const cleaned = text.replace(/\d+\s*#/g, " ");
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  if (!match) {
    return undefined;
  }
  return Number(match[1]);
}

export function inferSubcontractorId(text: string): string {
  if (/新进|这家/.test(text)) {
    return "sub_xinjin";
  }
  if (/沪东/.test(text)) {
    return "sub_hudong";
  }
  if (/浦江/.test(text)) {
    return "sub_pujiang";
  }
  if (/江南/.test(text)) {
    return "sub_jiangnan";
  }
  if (/临港模板|临港模/.test(text)) {
    return "sub_lingang";
  }
  return "";
}

export function extractRegion(text: string): string {
  if (text.includes("临港")) {
    return "临港";
  }
  if (text.includes("嘉定")) {
    return "嘉定";
  }
  if (text.includes("浦东") || text.includes("上海")) {
    return "上海";
  }
  return "";
}

export function buildToolArgs(name: string, question: string): ParsedToolArgs {
  const trade = extractTrade(question);
  const region = extractRegion(question);
  const quantity = extractQuantity(question);

  switch (name) {
    case "query_subcontractors":
      return {
        keyword: trade || "砌筑",
        region: region === "临港" || region === "浦东" ? "上海" : region,
        trade,
      };
    case "query_projects":
      return { keyword: question.includes("临港") ? "临港" : region || trade || "临港" };
    case "query_contracts":
      return { keyword: trade || "HT-2026" };
    case "calculate_price":
      return {
        trade: trade || "砌筑",
        quantity: quantity && quantity > 0 ? quantity : 100,
        region: region || "上海",
      };
    case "query_orders":
      return {
        keyword: /WO-\d+/.exec(question)?.[0] || trade || region || "临港",
      };
    case "query_logistics":
      return {
        keyword: trade || (question.includes("玻璃") ? "玻璃" : question.includes("幕墙") ? "玻璃" : "钢筋"),
      };
    case "query_qualifications":
      return {
        keyword: /缺失/.test(question) && !/是否过期|是否有效/.test(question) ? "缺失" : "",
        subcontractorId: inferSubcontractorId(question),
      };
    case "query_order":
      return { keyword: trade || region || "临港" };
    case "query_faq":
      return {
        keyword: /返工|不合格|整改/.test(question) ? "返工" : trade || "进场",
      };
    case "query_coupon":
      return { keyword: /让利|补贴|叠加|券/.test(question) ? "进场" : "进场" };
    default:
      return { keyword: question.slice(0, 20) };
  }
}
