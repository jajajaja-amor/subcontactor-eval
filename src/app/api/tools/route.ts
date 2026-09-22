import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { listTools } from "@/lib/ops-repo";
import { parseEnabledParam } from "@/lib/query";
import { listEnabledTools, runRegisteredTool, setToolEnabled } from "@/lib/tool-runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.enum(["enable", "disable"]),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("test"),
    name: z.string().min(1),
    input: z.record(z.string(), z.unknown()).default({}),
  }),
]);

export async function GET(request: Request) {
  const enabled = parseEnabledParam(new URL(request.url));
  if (enabled === true) {
    const tools = await listEnabledTools();
    return NextResponse.json({ ok: true, tools });
  }
  const tools = await listTools();
  const items = enabled === false ? tools.items.filter((item) => !item.enabled) : tools.items;
  return NextResponse.json({ ok: true, tools: items });
}

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "请求体无效" }, { status: 400 });
  }

  try {
    if (parsed.data.action === "enable" || parsed.data.action === "disable") {
      const tool = await setToolEnabled(parsed.data.id, parsed.data.action === "enable");
      revalidatePath("/tools");
      revalidatePath("/");
      return NextResponse.json({ ok: true, tool });
    }

    if (parsed.data.action === "test") {
      const result = await runRegisteredTool(parsed.data.name, parsed.data.input);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    return NextResponse.json({ ok: false, message: "不支持的操作" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool 操作失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
