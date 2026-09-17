import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { executeRuntime } from "@/lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["run", "retry", "takeover", "eval"]),
  id: z.string().min(1),
});

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "请求体无效，需要 action 和 id" },
      { status: 400 },
    );
  }

  try {
    const result = await executeRuntime(parsed.data.action, parsed.data.id);
    if (result.ok) {
      revalidatePath("/");
      revalidatePath("/tickets");
      revalidatePath("/runs");
      revalidatePath("/eval");
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "运行时执行失败";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
