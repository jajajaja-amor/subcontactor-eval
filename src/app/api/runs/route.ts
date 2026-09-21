import { NextResponse } from "next/server";

import { listRunRecords } from "@/lib/agent/run-records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20)));
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0));
  const all = await listRunRecords();
  const items = all.items.slice(offset, offset + limit);
  return NextResponse.json({
    ok: true,
    total: all.items.length,
    limit,
    offset,
    items,
  });
}
