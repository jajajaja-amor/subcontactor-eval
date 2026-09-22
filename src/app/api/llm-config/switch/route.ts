import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { LlmProviderError } from "@/lib/agent/llm";
import { getPublicLlmConfig, switchLlmProvider } from "@/lib/llm-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  provider: z.string().min(1),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "需要 provider" }, { status: 400 });
  }
  try {
    const switched = await switchLlmProvider(parsed.data);
    revalidatePath("/models");
    revalidatePath("/settings");
    const config = await getPublicLlmConfig();
    return NextResponse.json({
      ok: true,
      ...config,
      missing: switched.missing,
      hint: switched.hint,
    });
  } catch (error) {
    if (error instanceof LlmProviderError) {
      return NextResponse.json(error.toJSON(), { status: 400 });
    }
    const message = error instanceof Error ? error.message : "切换失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
