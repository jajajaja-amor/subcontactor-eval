import { NextResponse } from "next/server";

import { runAgent } from "@/lib/agent/run";
import { getRunRecord } from "@/lib/agent/run-records";

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
  const run = await runAgent({
    question: current.question,
    source: "retry",
    conversationId: current.conversationId,
  });
  return NextResponse.json({ ok: run.status !== "失败", run });
}
