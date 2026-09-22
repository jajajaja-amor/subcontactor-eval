import { NextResponse } from "next/server";
import { z } from "zod";

import { previewPlanner } from "@/lib/planner-admin";
import type { MandatoryCapability } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const capabilitySchema = z.enum([
  "subcontractor-matching",
  "matching-reason",
  "quote-reasoning",
  "price-calculation",
  "order-query",
  "logistics-query",
  "qualification-check",
  "risk-check",
  "human-handoff",
]);

const bodySchema = z.object({
  question: z.string().min(1),
  extraCapabilities: z.array(capabilitySchema).optional(),
});

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "需要测试问题" }, { status: 400 });
  }
  try {
    const result = await previewPlanner({
      question: parsed.data.question,
      extraCapabilities: parsed.data.extraCapabilities as MandatoryCapability[] | undefined,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "预览失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
