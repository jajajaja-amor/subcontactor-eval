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

async function attachPrompt(skill: Skill) {
  try {
    return { ...skill, systemPrompt: await readSkillFile(skill.filePath) };
  } catch {
    return { ...skill, systemPrompt: "" };
  }
}

export async function listEnabledSkills() {
  const skills = await listSkills();
  return Promise.all(skills.items.filter((item) => item.enabled).map(attachPrompt));
}

export async function listSkillsWithPrompts() {
  const skills = await listSkills();
  return Promise.all(skills.items.map(attachPrompt));
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
  try {
    return {
      ...skill,
      systemPrompt: await readSkillFile(skill.filePath),
    };
  } catch {
    return {
      ...skill,
      systemPrompt: "",
    };
  }
}

export async function getSkillVersion(skillId: string, versionId: string) {
  const versions = await listSkillVersionHistory(skillId);
  return versions.find((item) => item.id === versionId) ?? null;
}

export async function updateSkill(input: {
  id: string;
  systemPrompt?: string;
  changeNote?: string;
  filePath?: string;
  description?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  requiredTools?: string[];
  enabled?: boolean;
}) {
  const current = await getSkillWithPrompt(input.id);
  if (!current) {
    throw new Error(`没有找到 Skill ${input.id}`);
  }
  if (input.filePath) {
    assertSafeSkillFilePath(input.filePath);
  }

  if (input.systemPrompt != null || input.filePath) {
    await saveSkillVersion({
      id: input.id,
      systemPrompt: input.systemPrompt ?? current.systemPrompt ?? "",
      changeNote: input.changeNote ?? "",
      filePath: input.filePath,
    });
  }

  if (input.enabled != null && input.enabled !== current.enabled) {
    await setSkillEnabled(input.id, input.enabled);
  }

  const updated = await updateJson("skills.json", skillsCollectionSchema, (collection) => ({
    updatedAt: nowIso(),
    items: collection.items.map((item) =>
      item.id === input.id
        ? {
            ...item,
            description: input.description ?? item.description,
            model: input.model ?? item.model,
            temperature: input.temperature ?? item.temperature,
            maxTokens: input.maxTokens ?? item.maxTokens,
            requiredTools: input.requiredTools ?? item.requiredTools,
            updatedAt: nowIso(),
          }
        : item,
    ),
  }));
  const skill = updated.items.find((item) => item.id === input.id);
  if (!skill) {
    throw new Error(`没有找到 Skill ${input.id}`);
  }
  return getSkillWithPrompt(input.id);
}

export async function setSkillEnabled(id: string, enabled: boolean) {
  const updated = await updateJson("skills.json", skillsCollectionSchema, (current) => ({
    updatedAt: nowIso(),
    items: current.items.map((item) => {
      if (item.id !== id) {
        return item;
      }
      let nextStatus: Skill["status"] = item.status;
      if (enabled) {
        nextStatus = "已发布";
      } else if (item.status !== "草稿") {
        nextStatus = "已停用";
      }
      return {
        ...item,
        enabled,
        status: nextStatus,
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

  try {
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
  } catch (error) {
    if (targetPath === skill.filePath) {
      await writeSkillFile(skill.filePath, currentBody).catch(() => undefined);
    }
    throw error;
  }
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
