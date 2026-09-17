import "server-only";

import { randomUUID } from "node:crypto";

import { diffLines, formatDiff } from "@/lib/diff";
import { listSkills, listSkillVersions } from "@/lib/ops-repo";
import {
  skillsCollectionSchema,
  skillVersionsCollectionSchema,
} from "@/lib/schemas";
import {
  assertSafeSkillFilePath,
  hashSkillBody,
  readSkillFile,
  writeSkillFile,
} from "@/lib/skill-files";
import { listEnabledTools } from "@/lib/tool-runner";
import { updateJson } from "@/lib/store";
import type { Skill, SkillVersion } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

function bumpPatch(version: string) {
  const parts = version.split(".").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return `${version}.1`;
  }
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

export async function listEnabledSkills() {
  const skills = await listSkills();
  const enabled = skills.items.filter((item) => item.enabled);
  return Promise.all(
    enabled.map(async (skill) => ({
      ...skill,
      systemPrompt: await readSkillFile(skill.filePath),
    })),
  );
}

export async function getEnabledCapabilities() {
  const [skills, tools] = await Promise.all([
    listEnabledSkills(),
    listEnabledTools(),
  ]);
  return { skills, tools };
}

export async function getSkillWithPrompt(id: string) {
  const skills = await listSkills();
  const skill = skills.items.find((item) => item.id === id);
  if (!skill) {
    return null;
  }
  return {
    ...skill,
    systemPrompt: await readSkillFile(skill.filePath),
  };
}

export async function setSkillEnabled(id: string, enabled: boolean) {
  const updated = await updateJson("skills.json", skillsCollectionSchema, (current) => ({
    updatedAt: nowIso(),
    items: current.items.map((item) => {
      if (item.id !== id) {
        return item;
      }
      const status: Skill["status"] =
        item.status === "草稿" && enabled ? "已发布" : enabled ? "已发布" : "已停用";
      return {
        ...item,
        enabled,
        status: item.status === "草稿" && !enabled ? "草稿" : status,
        updatedAt: nowIso(),
      };
    }),
  }));
  const skill = updated.items.find((item) => item.id === id);
  if (!skill) {
    throw new Error(`没有找到 Skill ${id}`);
  }
  return skill;
}

export async function saveSkillVersion(input: {
  id: string;
  systemPrompt: string;
  changeNote: string;
  filePath?: string;
}) {
  const skills = await listSkills();
  const skill = skills.items.find((item) => item.id === input.id);
  if (!skill) {
    throw new Error(`没有找到 Skill ${input.id}`);
  }

  const targetPath = input.filePath ?? skill.filePath;
  assertSafeSkillFilePath(targetPath);
  const currentBody = await readSkillFile(skill.filePath);
  const nextBody = input.systemPrompt.replace(/\n$/u, "") + "\n";
  const currentHash = hashSkillBody(currentBody);
  const snapshots: SkillVersion[] = [];

  if (currentBody !== nextBody) {
    snapshots.push({
      id: `sv_${randomUUID().slice(0, 8)}`,
      skillId: skill.id,
      version: skill.version,
      changelog: "修改前自动快照",
      changeNote: "修改前自动快照",
      status: "历史",
      publishedAt: nowIso(),
      createdAt: nowIso(),
      hash: currentHash,
      filePath: skill.filePath,
      body: currentBody,
    });
  }

  await writeSkillFile(targetPath, nextBody);
  const nextVersion = currentBody === nextBody ? skill.version : bumpPatch(skill.version);
  const saved: SkillVersion = {
    id: `sv_${randomUUID().slice(0, 8)}`,
    skillId: skill.id,
    version: nextVersion,
    changelog: input.changeNote.trim() || "保存版本",
    changeNote: input.changeNote.trim() || "保存版本",
    status: "当前",
    publishedAt: nowIso(),
    createdAt: nowIso(),
    hash: hashSkillBody(nextBody),
    filePath: targetPath,
    body: nextBody,
  };

  await updateJson("skill-versions.json", skillVersionsCollectionSchema, (current) => ({
    updatedAt: nowIso(),
    items: [
      saved,
      ...snapshots,
      ...current.items.map((item) =>
        item.skillId === skill.id && item.status === "当前"
          ? { ...item, status: "历史" as const }
          : item,
      ),
    ],
  }));

  const updatedSkills = await updateJson("skills.json", skillsCollectionSchema, (current) => ({
    updatedAt: nowIso(),
    items: current.items.map((item) =>
      item.id === skill.id
        ? {
            ...item,
            version: nextVersion,
            filePath: targetPath,
            updatedAt: nowIso(),
          }
        : item,
    ),
  }));

  return {
    skill: updatedSkills.items.find((item) => item.id === skill.id)!,
    version: saved,
    snapshot: snapshots[0] ?? null,
  };
}

export async function listSkillVersionHistory(skillId: string) {
  const versions = await listSkillVersions();
  return versions.items.filter((item) => item.skillId === skillId);
}

export async function getSkillDiff(skillId: string, fromId: string, toId: string) {
  const versions = await listSkillVersionHistory(skillId);
  const from = versions.find((item) => item.id === fromId);
  const to = versions.find((item) => item.id === toId);
  if (!from || !to) {
    throw new Error("找不到对比的版本");
  }
  const lines = diffLines(from.body, to.body);
  return {
    from,
    to,
    lines,
    diff: formatDiff(lines),
  };
}
