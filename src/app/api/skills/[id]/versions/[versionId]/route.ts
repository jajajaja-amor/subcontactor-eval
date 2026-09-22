import { NextResponse } from "next/server";

import { getSkillVersion } from "@/lib/skill-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await context.params;
  const version = await getSkillVersion(id, versionId);
  if (!version) {
    return NextResponse.json(
      { ok: false, message: `没有找到版本 ${versionId}` },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, version });
}
