import { NextResponse } from "next/server";

import { checkDataIntegrity } from "@/lib/integrity";
import { getStoreDataDir } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const integrity = await checkDataIntegrity();
    return NextResponse.json({
      ok: integrity.ok,
      name: "SubcontractOps",
      dataDir: getStoreDataDir(),
      files: integrity.files.length,
      issues: integrity.issues,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "健康检查失败";
    return NextResponse.json(
      { ok: false, name: "SubcontractOps", message },
      { status: 500 },
    );
  }
}
