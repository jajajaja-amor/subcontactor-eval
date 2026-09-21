export type DiffLine = {
  type: "eq" | "add" | "del";
  text: string;
};

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i -= 1) {
    for (let j = n - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const lines: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      lines.push({ type: "eq", text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      lines.push({ type: "del", text: a[i] });
      i += 1;
    } else {
      lines.push({ type: "add", text: b[j] });
      j += 1;
    }
  }
  while (i < m) {
    lines.push({ type: "del", text: a[i] });
    i += 1;
  }
  while (j < n) {
    lines.push({ type: "add", text: b[j] });
    j += 1;
  }
  return lines;
}

export function formatDiff(lines: DiffLine[]): string {
  return lines
    .map((line) => {
      if (line.type === "add") {
        return `+ ${line.text}`;
      }
      if (line.type === "del") {
        return `- ${line.text}`;
      }
      return `  ${line.text}`;
    })
    .join("\n");
}
