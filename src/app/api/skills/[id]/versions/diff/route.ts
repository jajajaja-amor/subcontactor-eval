import { NextResponse } from "next/server";

import { getSkillDiff } from "@/lib/skill-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  const fromId = url.searchParams.get("fromId") ?? "";
  const toId = url.searchParams.get("toId") ?? "";
  if (!fromId || !toId) {
    return NextResponse.json(
      { ok: false, message: "需要 fromId 和 toId" },
      { status: 400 },
    );
  }
  try {
    const diff = await getSkillDiff(id, fromId, toId);
    return NextResponse.json({ ok: true, ...diff });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法生成 diff";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
