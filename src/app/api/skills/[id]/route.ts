import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { UnsafeSkillPathError } from "@/lib/skill-files";
import { getSkillWithPrompt, updateSkill } from "@/lib/skill-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const putSchema = z.object({
  systemPrompt: z.string().optional(),
  changeNote: z.string().optional(),
  filePath: z.string().optional(),
  description: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().optional(),
  maxTokens: z.number().int().optional(),
  requiredTools: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const skill = await getSkillWithPrompt(id);
  if (!skill) {
    return NextResponse.json({ ok: false, message: `没有找到 Skill ${id}` }, { status: 404 });
  }
  return NextResponse.json({ ok: true, skill });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const json: unknown = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "请求体无效" }, { status: 400 });
  }
  try {
    const skill = await updateSkill({ id, ...parsed.data });
    revalidatePath("/skills");
    revalidatePath(`/skills/${id}`);
    revalidatePath("/planner");
    return NextResponse.json({ ok: true, skill });
  } catch (error) {
    if (error instanceof UnsafeSkillPathError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "保存 Skill 失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
