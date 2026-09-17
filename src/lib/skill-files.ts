import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { getProjectRoot } from "@/lib/paths";
import { withFileLock } from "@/lib/store";

export class UnsafeSkillPathError extends Error {
  constructor(message = "不允许路径穿越写入项目外文件") {
    super(message);
    this.name = "UnsafeSkillPathError";
  }
}

export function hashSkillBody(body: string): string {
  return createHash("sha256").update(body).digest("hex").slice(0, 16);
}

export function assertSafeSkillFilePath(filePath: string): string {
  const normalized = filePath.replaceAll("\\", "/").trim();
  if (
    !normalized ||
    normalized.includes("..") ||
    path.isAbsolute(filePath) ||
    !normalized.startsWith("skills/") ||
    !normalized.endsWith(".md")
  ) {
    throw new UnsafeSkillPathError();
  }

  const root = getProjectRoot();
  const skillsRoot = path.resolve(root, "skills");
  const resolved = path.resolve(root, normalized);
  const relative = path.relative(skillsRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new UnsafeSkillPathError();
  }

  return resolved;
}

export async function readSkillFile(filePath: string): Promise<string> {
  const resolved = assertSafeSkillFilePath(filePath);
  return fs.readFile(resolved, "utf8");
}

export async function writeSkillFile(filePath: string, body: string): Promise<void> {
  const resolved = assertSafeSkillFilePath(filePath);
  await withFileLock(resolved, async () => {
    await fs.mkdir(path.dirname(resolved), { recursive: true });
    const tempPath = `${resolved}.${process.pid}.${randomUUID()}.tmp`;
    try {
      const handle = await fs.open(tempPath, "w");
      try {
        await handle.writeFile(body, "utf8");
        await handle.sync();
      } finally {
        await handle.close();
      }
      await fs.rename(tempPath, resolved);
    } catch (error) {
      await fs.unlink(tempPath).catch(() => undefined);
      throw error;
    }
  });
}
