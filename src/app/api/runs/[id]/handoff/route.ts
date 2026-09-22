import { NextResponse } from "next/server";

import { getRunRecord, saveRunRecord } from "@/lib/agent/run-records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const current = await getRunRecord(id);
  if (!current) {
    return NextResponse.json({ ok: false, message: `没有找到运行 ${id}` }, { status: 404 });
  }
  const run = await saveRunRecord({
    ...current,
    source: "handoff",
    status: "已接管",
    finalReply: `${current.finalReply}\n\n已转人工接管，自动回复已停止。`,
    error: current.error,
  });
  return NextResponse.json({ ok: true, run });
}
