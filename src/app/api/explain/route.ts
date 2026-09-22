import { NextResponse } from "next/server";
import { z } from "zod";

import { explainRun } from "@/lib/agent/explain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  runId: z.string().min(1),
  stepId: z.string().optional(),
  riskResult: z.boolean().optional(),
});

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "请求体无效，需要 { runId, stepId?, riskResult? }" },
      { status: 400 },
    );
  }
  try {
    const explanation = await explainRun(parsed.data);
    return NextResponse.json({ ok: true, explanation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "解释失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
