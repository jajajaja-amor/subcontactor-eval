import "server-only";

import { calculatePrice } from "../../tools/calculate-price";
import { queryActivities, queryCoupon } from "../../tools/query-coupon";
import { queryFaq, queryReturnPolicies } from "../../tools/query-faq";
import { queryContracts } from "../../tools/query-contracts";
import { queryLogistics } from "../../tools/query-logistics";
import { queryOrder } from "../../tools/query-order";
import { queryOrders } from "../../tools/query-orders";
import { queryProjects } from "../../tools/query-projects";
import { queryQualifications } from "../../tools/query-qualifications";
import { querySubcontractors } from "../../tools/query-subcontractors";
import { listTools } from "@/lib/ops-repo";
import { toolsCollectionSchema } from "@/lib/schemas";
import { updateJson } from "@/lib/store";
import type { Tool } from "@/lib/types";

export type ToolRunResult = {
  ok: boolean;
  name: string;
  enabled: boolean;
  data?: unknown;
  error?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function listEnabledTools() {
  const tools = await listTools();
  return tools.items.filter((item) => item.enabled);
}

export async function setToolEnabled(id: string, enabled: boolean) {
  const updated = await updateJson("tools.json", toolsCollectionSchema, (current) => ({
    updatedAt: nowIso(),
    items: current.items.map((item) => {
      if (item.id !== id) {
        return item;
      }
      const status: Tool["status"] =
        item.status === "调试中" && !enabled
          ? "调试中"
          : enabled
            ? "已启用"
            : "已停用";
      return { ...item, enabled, status };
    }),
  }));
  const tool = updated.items.find((item) => item.id === id);
  if (!tool) {
    throw new Error(`没有找到 Tool ${id}`);
  }
  return tool;
}

export async function runRegisteredTool(
  name: string,
  rawInput: Record<string, unknown> = {},
): Promise<ToolRunResult> {
  const tools = await listTools();
  const tool =
    tools.items.find((item) => item.name === name) ??
    tools.items.find((item) => item.id === name);
  if (!tool) {
    return { ok: false, name, enabled: false, error: `未注册的 Tool ${name}` };
  }
  if (!tool.enabled) {
    return { ok: false, name: tool.name, enabled: false, error: `${tool.name} 已停用` };
  }

  try {
    const input = rawInput;
    switch (tool.name) {
      case "query_subcontractors":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: await querySubcontractors({
            keyword: String(input.keyword ?? ""),
            region: String(input.region ?? ""),
            trade: String(input.trade ?? ""),
          }),
        };
      case "query_projects":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: await queryProjects({ keyword: String(input.keyword ?? "") }),
        };
      case "query_contracts":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: await queryContracts({
            keyword: String(input.keyword ?? ""),
            contractNo: String(input.contractNo ?? ""),
          }),
        };
      case "calculate_price":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: await calculatePrice({
            trade: String(input.trade ?? ""),
            quantity: Number(input.quantity),
            region: input.region ? String(input.region) : undefined,
            subcontractorId: input.subcontractorId
              ? String(input.subcontractorId)
              : undefined,
          }),
        };
      case "query_orders":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: await queryOrders({
            keyword: String(input.keyword ?? ""),
            workOrderNo: String(input.workOrderNo ?? ""),
          }),
        };
      case "query_logistics":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: await queryLogistics(
            String(input.keyword ?? input.orderId ?? ""),
          ),
        };
      case "query_qualifications":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: await queryQualifications({
            keyword: String(input.keyword ?? ""),
            subcontractorId: String(input.subcontractorId ?? ""),
          }),
        };
      case "query_order":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: await queryOrder(String(input.keyword ?? "")),
        };
      case "query_coupon":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: {
            coupons: await queryCoupon(String(input.keyword ?? "")),
            activities: await queryActivities(String(input.keyword ?? "")),
          },
        };
      case "query_faq":
        return {
          ok: true,
          name: tool.name,
          enabled: true,
          data: {
            faqs: await queryFaq(String(input.keyword ?? "")),
            policies: await queryReturnPolicies(String(input.keyword ?? "")),
          },
        };
      default:
        return {
          ok: false,
          name: tool.name,
          enabled: true,
          error: `${tool.name} 尚未实现可测试入口`,
        };
    }
  } catch (error) {
    return {
      ok: false,
      name: tool.name,
      enabled: true,
      error: error instanceof Error ? error.message : "工具执行失败",
    };
  }
}
