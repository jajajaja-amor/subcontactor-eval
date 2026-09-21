import { NextResponse } from "next/server";

import { listTools } from "@/lib/ops-repo";
import { getEnabledCapabilities, listSkillsWithPrompts } from "@/lib/skill-registry";

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

  const [skills, toolCollection] = await Promise.all([
    listSkillsWithPrompts(),
    listTools(),
  ]);
  const tools = toolCollection.items;

  return NextResponse.json({
    ok: true,
    skills,
    tools,
    enabledSkillCount: skills.filter((item) => item.enabled).length,
    enabledToolCount: tools.filter((item) => item.enabled).length,
  });
}
