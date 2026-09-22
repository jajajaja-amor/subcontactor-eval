import "server-only";

import { listProducts, listSubcontractors } from "@/lib/catalog-repo";

export type PriceQuote = {
  trade: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  quoteMin: number | null;
  quoteMax: number | null;
  withinRange: boolean;
  notes: string;
};

export async function calculatePrice(input: {
  trade: string;
  quantity: number;
  region?: string;
  subcontractorId?: string;
}): Promise<PriceQuote> {
  const trade = input.trade.trim();
  const quantity = Number(input.quantity);
  if (!trade || !Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("calculate_price 需要有效的工种和工程量");
  }

  const [products, subcontractors] = await Promise.all([
    listProducts(),
    listSubcontractors(),
  ]);

  const product = products.items.find(
    (item) => item.name.includes(trade) || item.category.includes(trade),
  );
  const region = input.region?.trim() ?? "";
  const regionNeedle = region === "临港" || region === "浦东" ? "上海" : region;
  const vendor = input.subcontractorId
    ? subcontractors.items.find((item) => item.id === input.subcontractorId)
    : subcontractors.items.find(
        (item) =>
          item.trades.some((value) => value.includes(trade)) &&
          (!regionNeedle || item.region.includes(regionNeedle) || item.region.includes(region)),
      );

  const unitPrice = vendor
    ? Math.round((vendor.quoteMin + vendor.quoteMax) / 2)
    : (product?.unitPrice ?? 0);
  const amount = unitPrice * quantity;
  const quoteMin = vendor?.quoteMin ?? product?.unitPrice ?? null;
  const quoteMax = vendor?.quoteMax ?? product?.unitPrice ?? null;
  const withinRange =
    quoteMin != null && quoteMax != null
      ? unitPrice >= quoteMin && unitPrice <= quoteMax
      : false;
  const quantityUnit =
    product?.unit || (vendor?.quoteUnit ? vendor.quoteUnit.replace(/^元\//, "") : "") || "项";

  return {
    trade,
    quantity,
    unit: quantityUnit,
    unitPrice,
    amount,
    quoteMin,
    quoteMax,
    withinRange,
    notes: vendor
      ? `按 ${vendor.name} 报价区间 ${vendor.quoteMin}-${vendor.quoteMax} ${vendor.quoteUnit} 取中位价，未超出区间。`
      : product
        ? `未命中分包商，回退到目录单价 ${product.unitPrice} 元/${product.unit}。`
        : "未找到对应工种单价，请人工核价。",
  };
}
