import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { LlmProviderError } from "@/lib/agent/llm";
import { getPublicLlmConfig, saveLlmConfig } from "@/lib/llm-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z.object({
  provider: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().int().optional(),
  fallbackModel: z.string().optional(),
});

export async function GET() {
  const config = await getPublicLlmConfig();
  return NextResponse.json({ ok: true, ...config });
}

export async function PUT(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "LLM 配置无效" }, { status: 400 });
  }
  try {
    await saveLlmConfig(parsed.data);
    revalidatePath("/models");
    revalidatePath("/settings");
    const config = await getPublicLlmConfig();
    return NextResponse.json({ ok: true, ...config });
  } catch (error) {
    if (error instanceof LlmProviderError) {
      return NextResponse.json(error.toJSON(), { status: 400 });
    }
    const message = error instanceof Error ? error.message : "保存失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
