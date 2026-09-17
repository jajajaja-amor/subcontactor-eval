import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getStoreTestSnapshot,
  runAtomicFailureTest,
  runStoreLockTest,
} from "@/lib/store-test";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["lock", "atomic"]).default("lock"),
});

export async function GET() {
  const snapshot = await getStoreTestSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "请求体无效，action 只能是 lock 或 atomic" },
      { status: 400 },
    );
  }

  const result =
    parsed.data.action === "lock"
      ? await runStoreLockTest()
      : await runAtomicFailureTest();

  return NextResponse.json(
    {
      ok: result.ok,
      action: parsed.data.action,
      result,
    },
    { status: result.ok ? 200 : 500 },
  );
}
