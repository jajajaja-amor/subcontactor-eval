"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { RegistryToggle } from "@/components/registry-toggle";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { Skill, SkillVersion } from "@/lib/types";
import { cn } from "@/lib/utils";

type SkillWithPrompt = Skill & { systemPrompt?: string };

export function SkillWorkbench({
  skills,
  versions,
  initialSkillId,
}: {
  skills: Skill[];
  versions: SkillVersion[];
  initialSkillId?: string;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(
    initialSkillId && skills.some((item) => item.id === initialSkillId)
      ? initialSkillId
      : (skills[0]?.id ?? ""),
  );
  const selected = skills.find((item) => item.id === selectedId) ?? null;
  const selectedVersions = useMemo(
    () => versions.filter((item) => item.skillId === selectedId),
    [selectedId, versions],
  );

  const [prompt, setPrompt] = useState("");
  const [filePath, setFilePath] = useState(selected?.filePath ?? "");
  const [changeNote, setChangeNote] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [diff, setDiff] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const skill = skills.find((item) => item.id === selectedId);
    if (!skill) {
      return;
    }
    setFilePath(skill.filePath);
    setChangeNote("");
    setDiff("");
    const history = versions.filter((item) => item.skillId === selectedId);
    setFromId(history[1]?.id ?? history[0]?.id ?? "");
    setToId(history[0]?.id ?? "");
    let cancelled = false;
    setLoading(true);
    void fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get", id: skill.id }),
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          ok: boolean;
          message?: string;
          skill?: SkillWithPrompt;
        };
        if (!response.ok || !payload.ok || !payload.skill) {
          throw new Error(payload.message ?? "无法读取 Skill 正文");
        }
        if (!cancelled) {
          setPrompt(payload.skill.systemPrompt ?? "");
        }
      })
      .catch((error: unknown) => {
        toast.error("读取 Skill 失败", {
          description: error instanceof Error ? error.message : "请重试",
        });
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, skills, versions]);

  async function saveVersion() {
    if (!selected) {
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          id: selected.id,
          systemPrompt: prompt,
          changeNote,
          filePath,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        snapshot?: SkillVersion | null;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "保存失败");
      }
      toast.success("版本已保存", {
        description: payload.snapshot
          ? `已保留修改前快照 ${payload.snapshot.version}`
          : "正文未变化，已记录当前版本",
      });
      router.refresh();
    } catch (error) {
      toast.error("保存失败", {
        description: error instanceof Error ? error.message : "请重试",
      });
    } finally {
      setSaving(false);
    }
  }

  async function loadDiff() {
    if (!selected || !fromId || !toId) {
      toast.error("请选择两个版本再查看 diff");
      return;
    }
    try {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "diff",
          id: selected.id,
          fromId,
          toId,
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        diff?: string;
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "无法生成 diff");
      }
      setDiff(payload.diff ?? "");
    } catch (error) {
      toast.error("查看 diff 失败", {
        description: error instanceof Error ? error.message : "请重试",
      });
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Skill 目录</CardTitle>
          <CardDescription>
            当前 {skills.length} 个 Skill，启用 {skills.filter((item) => item.enabled).length}{" "}
            个。Planner / Executor 只读取启用项。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>模型</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills.map((skill) => (
                <TableRow
                  key={skill.id}
                  className={cn(skill.id === selectedId && "bg-muted/50")}
                >
                  <TableCell>
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => setSelectedId(skill.id)}
                    >
                      <div className="font-medium">{skill.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {skill.id} · {skill.description}
                      </div>
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{skill.version}</TableCell>
                  <TableCell className="text-xs">
                    {skill.model} / t={skill.temperature} / {skill.maxTokens}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <StatusBadge
                        label={skill.enabled ? "启用" : "停用"}
                        tone={skill.enabled ? "success" : "danger"}
                      />
                      <StatusBadge label={skill.status} tone={statusTone(skill.status)} />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedId(skill.id)}
                      >
                        编辑
                      </Button>
                      <RegistryToggle
                        kind="skills"
                        id={skill.id}
                        enabled={skill.enabled}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected ? (
        <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>编辑 {selected.name}</CardTitle>
              <CardDescription>
                修改前自动保留快照。路径必须位于 skills/ 且以 .md 结尾，写入 ../../ 会被拒绝。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">文件路径</span>
                  <Input
                    value={filePath}
                    onChange={(event) => setFilePath(event.target.value)}
                    spellCheck={false}
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">变更说明</span>
                  <Input
                    value={changeNote}
                    onChange={(event) => setChangeNote(event.target.value)}
                    placeholder="本版修改了什么"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                依赖工具：{selected.requiredTools.join("、") || "无"}
              </p>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                disabled={loading}
                className="min-h-72 font-mono text-xs"
              />
              <Button type="button" disabled={saving || loading} onClick={() => void saveVersion()}>
                {saving ? "正在保存" : "保存版本"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>版本与 diff</CardTitle>
              <CardDescription>刷新后仍可看到已保存版本。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">对比起点</span>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                    value={fromId}
                    onChange={(event) => setFromId(event.target.value)}
                  >
                    {selectedVersions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.version} · {version.status}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">对比终点</span>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                    value={toId}
                    onChange={(event) => setToId(event.target.value)}
                  >
                    {selectedVersions.map((version) => (
                      <option key={version.id} value={version.id}>
                        {version.version} · {version.status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadDiff()}>
                查看 diff
              </Button>
              {diff ? (
                <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">
                  {diff}
                </pre>
              ) : null}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>版本</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>说明</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedVersions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="font-mono text-xs">
                        {version.version}
                        <div className="text-muted-foreground">{version.hash}</div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={version.status}
                          tone={statusTone(version.status)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>{version.changeNote}</div>
                        <div className="text-xs text-muted-foreground">{version.createdAt}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
