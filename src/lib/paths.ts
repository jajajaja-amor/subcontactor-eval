import path from "node:path";

const DATA_FILE_PATTERN = /^[a-z0-9][a-z0-9._-]*\.json$/i;

export function getProjectRoot(): string {
  if (process.env.PROJECT_ROOT) {
    return path.resolve(/* turbopackIgnore: true */ process.env.PROJECT_ROOT);
  }

  return process.cwd();
}

export function getDataDir(): string {
  if (process.env.DATA_DIR) {
    return path.resolve(/* turbopackIgnore: true */ process.env.DATA_DIR);
  }

  return path.join(getProjectRoot(), "data");
}

export function assertDataFileName(fileName: string): string {
  const baseName = path.basename(fileName);
  if (baseName !== fileName || !DATA_FILE_PATTERN.test(fileName)) {
    throw new Error(`非法数据文件名: ${fileName}`);
  }

  return baseName;
}

export function resolveDataFile(fileName: string): string {
  return path.join(getDataDir(), assertDataFileName(fileName));
}
