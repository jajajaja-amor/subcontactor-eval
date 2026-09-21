import { NextResponse } from "next/server";

import { getRunRecord } from "@/lib/agent/run-records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const run = await getRunRecord(id);
  if (!run) {
    return NextResponse.json({ ok: false, message: `没有找到运行 ${id}` }, { status: 404 });
  }
  return NextResponse.json({ ok: true, run });
}
