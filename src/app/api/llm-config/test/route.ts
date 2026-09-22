import { NextResponse } from "next/server";

import { testLlmConnection } from "@/lib/llm-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await testLlmConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
