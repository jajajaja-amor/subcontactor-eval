import { NextResponse } from "next/server";
import { z } from "zod";

import { getRunRecord } from "@/lib/agent/run-records";
import { annotationsCollectionSchema } from "@/lib/schemas";
import { updateJson } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  author: z.string().default("值班客服"),
  issue: z.string().min(1),
  suggestion: z.string().min(1),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const current = await getRunRecord(id);
  if (!current) {
    return NextResponse.json({ ok: false, message: `没有找到运行 ${id}` }, { status: 404 });
  }
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "需要 issue 和 suggestion" }, { status: 400 });
  }

  const updated = await updateJson("annotations.json", annotationsCollectionSchema, (currentItems) => ({
    updatedAt: new Date().toISOString(),
    items: [
      {
        id: `an_${Date.now().toString(36)}`,
        runId: id,
        author: parsed.data.author,
        issue: parsed.data.issue,
        suggestion: parsed.data.suggestion,
        createdAt: new Date().toISOString(),
      },
      ...currentItems.items,
    ],
  }));

  return NextResponse.json({
    ok: true,
    annotation: updated.items[0],
  });
}
