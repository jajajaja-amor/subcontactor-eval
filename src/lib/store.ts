import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { z } from "zod";

import { getDataDir, resolveDataFile } from "@/lib/paths";

const mutexes = new Map<string, Promise<unknown>>();

export type WriteJsonOptions = {
  throwBeforeRename?: boolean;
};

export function getStoreDataDir(): string {
  return getDataDir();
}

export async function withFileLock<T>(
  fileNameOrPath: string,
  fn: () => Promise<T>,
): Promise<T> {
  const key = fileNameOrPath.includes(path.sep)
    ? fileNameOrPath
    : resolveDataFile(fileNameOrPath);
  const previous = mutexes.get(key) ?? Promise.resolve();
  const current = previous.then(fn, fn);
  mutexes.set(
    key,
    current.then(
      () => undefined,
      () => undefined,
    ),
  );
  return current;
}

async function writeFileAtomic(
  filePath: string,
  contents: string,
  options: WriteJsonOptions = {},
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;

  try {
    const handle = await fs.open(tempPath, "w");
    try {
      await handle.writeFile(contents, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }

    if (options.throwBeforeRename) {
      throw new Error("模拟写入失败：临时文件已落盘但尚未替换正式文件");
    }

    await fs.rename(tempPath, filePath);
  } catch (error) {
    await fs.unlink(tempPath).catch(() => undefined);
    throw error;
  }
}

export async function readJson<T>(
  fileName: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const filePath = resolveDataFile(fileName);
  const raw = await fs.readFile(filePath, "utf8");
  return schema.parse(JSON.parse(raw) as unknown);
}

export async function writeJson<T>(
  fileName: string,
  schema: z.ZodType<T>,
  value: T,
  options: WriteJsonOptions = {},
): Promise<T> {
  const parsed = schema.parse(value);
  const filePath = resolveDataFile(fileName);

  await withFileLock(filePath, async () => {
    await writeFileAtomic(
      filePath,
      `${JSON.stringify(parsed, null, 2)}\n`,
      options,
    );
  });

  return parsed;
}

export async function updateJson<T>(
  fileName: string,
  schema: z.ZodType<T>,
  updater: (current: T) => T | Promise<T>,
): Promise<T> {
  const filePath = resolveDataFile(fileName);

  return withFileLock(filePath, async () => {
    const current = schema.parse(
      JSON.parse(await fs.readFile(filePath, "utf8")) as unknown,
    );
    const next = schema.parse(await updater(current));
    await writeFileAtomic(filePath, `${JSON.stringify(next, null, 2)}\n`);
    return next;
  });
}

export async function inspectDataFile(fileName: string): Promise<{
  exists: boolean;
  size: number;
  path: string;
}> {
  const filePath = resolveDataFile(fileName);
  try {
    const stat = await fs.stat(filePath);
    return { exists: true, size: stat.size, path: filePath };
  } catch {
    return { exists: false, size: 0, path: filePath };
  }
}
