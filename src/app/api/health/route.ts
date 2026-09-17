import { NextResponse } from "next/server";

import { getStoreDataDir } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    name: "SubcontractOps",
    dataDir: getStoreDataDir(),
  });
}
