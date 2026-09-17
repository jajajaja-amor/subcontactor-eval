import { NextResponse } from "next/server";

import { listSkills, listTools } from "@/lib/ops-repo";
import { readSkillFile } from "@/lib/skill-files";
import { getEnabledCapabilities } from "@/lib/skill-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const includeDisabled =
    new URL(request.url).searchParams.get("includeDisabled") === "1";

  if (!includeDisabled) {
    const { skills, tools } = await getEnabledCapabilities();
    return NextResponse.json({
      ok: true,
      skills,
      tools,
      enabledSkillCount: skills.length,
      enabledToolCount: tools.length,
    });
  }

  const [skillCollection, toolCollection] = await Promise.all([
    listSkills(),
    listTools(),
  ]);
  const skills = await Promise.all(
    skillCollection.items.map(async (skill) => ({
      ...skill,
      systemPrompt: await readSkillFile(skill.filePath),
    })),
  );
  const tools = toolCollection.items;

  return NextResponse.json({
    ok: true,
    skills,
    tools,
    enabledSkillCount: skills.filter((item) => item.enabled).length,
    enabledToolCount: tools.filter((item) => item.enabled).length,
  });
}
