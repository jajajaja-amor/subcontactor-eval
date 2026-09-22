import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { listTools } from "@/lib/ops-repo";
import { setToolEnabled } from "@/lib/tool-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z.object({
  enabled: z.boolean(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const tools = await listTools();
  const tool =
    tools.items.find((item) => item.id === id) ??
    tools.items.find((item) => item.name === id);
  if (!tool) {
    return NextResponse.json({ ok: false, message: `没有找到 Tool ${id}` }, { status: 404 });
  }
  return NextResponse.json({
    ok: true,
    tool,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    sampleInput: tool.sampleInput,
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const json: unknown = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "需要 { enabled }" }, { status: 400 });
  }
  try {
    const tools = await listTools();
    const current =
      tools.items.find((item) => item.id === id) ??
      tools.items.find((item) => item.name === id);
    if (!current) {
      return NextResponse.json({ ok: false, message: `没有找到 Tool ${id}` }, { status: 404 });
    }
    const tool = await setToolEnabled(current.id, parsed.data.enabled);
    revalidatePath("/tools");
    revalidatePath("/planner");
    return NextResponse.json({ ok: true, tool });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新 Tool 失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
