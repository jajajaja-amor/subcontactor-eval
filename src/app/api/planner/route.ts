import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getPlannerConfig, listPlannerOptions, savePlannerConfig } from "@/lib/planner-config";
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

const putSchema = z.object({
  version: z.string().optional(),
  prompt: z.string().optional(),
  allowedSkillIds: z.array(z.string()).optional(),
  allowedToolNames: z.array(z.string()).optional(),
  extraCapabilities: z.array(capabilitySchema).optional(),
});

export async function GET() {
  const [config, options] = await Promise.all([getPlannerConfig(), listPlannerOptions()]);
  return NextResponse.json({
    ok: true,
    config,
    ...options,
  });
}

export async function PUT(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Planner 配置无效" }, { status: 400 });
  }
  const config = await savePlannerConfig({
    ...parsed.data,
    extraCapabilities: parsed.data.extraCapabilities as MandatoryCapability[] | undefined,
  });
  revalidatePath("/planner");
  return NextResponse.json({ ok: true, config });
}
