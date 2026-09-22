import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { listSkills } from "@/lib/ops-repo";
import { parseEnabledParam } from "@/lib/query";
import { UnsafeSkillPathError } from "@/lib/skill-files";
import {
  getSkillDiff,
  getSkillWithPrompt,
  listEnabledSkills,
  listSkillVersionHistory,
  saveSkillVersion,
  setSkillEnabled,
} from "@/lib/skill-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.enum(["enable", "disable"]),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("save"),
    id: z.string().min(1),
    systemPrompt: z.string(),
    changeNote: z.string().default(""),
    filePath: z.string().optional(),
  }),
  z.object({
    action: z.literal("diff"),
    id: z.string().min(1),
    fromId: z.string().min(1),
    toId: z.string().min(1),
  }),
  z.object({
    action: z.literal("get"),
    id: z.string().min(1),
  }),
  z.object({
    action: z.literal("versions"),
    id: z.string().min(1),
  }),
]);

export async function GET(request: Request) {
  const enabled = parseEnabledParam(new URL(request.url));
  if (enabled === true) {
    const skills = await listEnabledSkills();
    return NextResponse.json({ ok: true, skills });
  }
  const skills = await listSkills();
  const items =
    enabled === false ? skills.items.filter((item) => !item.enabled) : skills.items;
  return NextResponse.json({ ok: true, skills: items });
}

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "请求体无效" }, { status: 400 });
  }

  try {
    const body = parsed.data;
    if (body.action === "enable" || body.action === "disable") {
      const skill = await setSkillEnabled(body.id, body.action === "enable");
      revalidatePath("/skills");
      revalidatePath(`/skills/${body.id}`);
      revalidatePath("/");
      return NextResponse.json({ ok: true, skill });
    }
    if (body.action === "save") {
      const result = await saveSkillVersion({
        id: body.id,
        systemPrompt: body.systemPrompt,
        changeNote: body.changeNote,
        filePath: body.filePath,
      });
      revalidatePath("/skills");
      revalidatePath(`/skills/${body.id}`);
      revalidatePath("/");
      return NextResponse.json({ ok: true, ...result });
    }
    if (body.action === "diff") {
      const diff = await getSkillDiff(body.id, body.fromId, body.toId);
      return NextResponse.json({ ok: true, ...diff });
    }
    if (body.action === "get") {
      const skill = await getSkillWithPrompt(body.id);
      if (!skill) {
        return NextResponse.json({ ok: false, message: "没有找到 Skill" }, { status: 404 });
      }
      return NextResponse.json({ ok: true, skill });
    }
    const versions = await listSkillVersionHistory(body.id);
    return NextResponse.json({ ok: true, versions });
  } catch (error) {
    if (error instanceof UnsafeSkillPathError) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "Skill 操作失败";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
