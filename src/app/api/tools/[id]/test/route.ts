import { NextResponse } from "next/server";
import { z } from "zod";

import { listTools } from "@/lib/ops-repo";
import { runRegisteredTool } from "@/lib/tool-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  input: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const json: unknown = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json ?? {});
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "输入必须是对象" }, { status: 400 });
  }

  const tools = await listTools();
  const tool =
    tools.items.find((item) => item.id === id) ??
    tools.items.find((item) => item.name === id);
  if (!tool) {
    return NextResponse.json({ ok: false, message: `没有找到 Tool ${id}` }, { status: 404 });
  }

  const started = Date.now();
  const result = await runRegisteredTool(tool.name, parsed.data.input);
  const durationMs = Date.now() - started;
  return NextResponse.json(
    {
      ok: result.ok,
      name: tool.name,
      enabled: result.enabled,
      input: parsed.data.input,
      output: result.ok ? (result.data ?? null) : null,
      durationMs,
      error: result.ok ? undefined : result.error,
    },
    { status: result.ok ? 200 : 400 },
  );
}
