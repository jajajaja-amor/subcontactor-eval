import { NextResponse } from "next/server";

import { listSkillVersionHistory } from "@/lib/skill-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const versions = await listSkillVersionHistory(id);
  return NextResponse.json({ ok: true, versions });
}
