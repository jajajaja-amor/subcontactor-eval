"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminError, AdminLoading, AdminSuccess } from "@/components/admin-state";
import { EmptyState } from "@/components/empty-state";
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
type EnabledFilter = "all" | "enabled" | "disabled";

function queueMicroTaskScroll(elementId: string) {
  queueMicrotask(() => {
    document.getElementById(elementId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

export function SkillWorkbench({
  skills: initialSkills,
  versions: initialVersions,
  initialSkillId,
}: {
  skills: Skill[];
  versions: SkillVersion[];
  initialSkillId?: string;
}) {
  const [filter, setFilter] = useState<EnabledFilter>("all");
  const [skills, setSkills] = useState(initialSkills);
  const [listState, setListState] = useState<"success" | "loading" | "error">("success");
  const [listError, setListError] = useState("");
  const [selectedId, setSelectedId] = useState(
    initialSkillId && initialSkills.some((item) => item.id === initialSkillId)
      ? initialSkillId
      : (initialSkills[0]?.id ?? ""),
  );

  const loadSkills = useCallback(async (nextFilter: EnabledFilter) => {
    setListState("loading");
    setListError("");
    const query =
      nextFilter === "enabled" ? "?enabled=true" : nextFilter === "disabled" ? "?enabled=false" : "";
    try {
      const response = await fetch(`/api/skills${query}`);
      const payload = (await response.json()) as { ok?: boolean; skills?: Skill[]; message?: string };
      if (!response.ok || !payload.skills) {
        throw new Error(payload.message ?? "无法读取 Skill 列表");
      }
      setSkills(payload.skills);
      setListState("success");
      setSelectedId((current) =>
        payload.skills!.some((item) => item.id === current) ? current : (payload.skills![0]?.id ?? ""),
      );
    } catch (error) {
      setListState("error");
      setListError(error instanceof Error ? error.message : "读取失败");
    }
  }, []);

  const selected = skills.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Skill 目录</CardTitle>
          <CardDescription>
            名称、描述、启用状态、模型、温度、Token 上限和依赖 Tool。筛选会请求服务端 GET /api/skills。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["all", "全部"],
                ["enabled", "已启用"],
                ["disabled", "已停用"],
              ] as const
            ).map(([value, label]) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={filter === value ? "default" : "outline"}
                onClick={() => {
                  setFilter(value);
                  void loadSkills(value);
                }}
              >
                {label}
              </Button>
            ))}
          </div>
          {listState === "loading" ? <AdminLoading label="正在读取 Skill 列表" /> : null}
          {listState === "error" ? <AdminError message={listError} /> : null}
          {listState === "success" && skills.length === 0 ? (
            <EmptyState title="没有符合筛选的 Skill" description="切换筛选或检查 skills.json。" />
          ) : null}
          {listState === "success" && skills.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>模型 / 温度 / Token</TableHead>
                    <TableHead>依赖 Tool</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skills.map((skill) => (
                    <TableRow key={skill.id} className={cn(skill.id === selectedId && "bg-muted/50")}>
                      <TableCell className="min-w-48">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => {
                            setSelectedId(skill.id);
                            queueMicroTaskScroll("skill-editor");
                          }}
                        >
                          <div className="font-medium">{skill.name}</div>
                          <div className="text-xs break-words text-muted-foreground">
                            {skill.id} · {skill.description}
                          </div>
                        </button>
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {skill.model} / t={skill.temperature} / {skill.maxTokens}
                      </TableCell>
                      <TableCell className="max-w-56 text-xs break-words">
                        {skill.requiredTools.join("、") || "无"}
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
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedId(skill.id);
                              queueMicroTaskScroll("skill-editor");
                            }}
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
            </div>
          ) : null}
        </CardContent>
      </Card>

      {selected ? (
        <div id="skill-editor" className="scroll-mt-24">
          <SkillEditor
            key={selected.id}
            skill={selected}
            initialVersions={initialVersions.filter((item) => item.skillId === selected.id)}
            onSaved={() => void loadSkills(filter)}
          />
        </div>
      ) : null}
    </div>
  );
}

function SkillEditor({
  skill,
  initialVersions,
  onSaved,
}: {
  skill: Skill;
  initialVersions: SkillVersion[];
  onSaved: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState(skill.description);
  const [model, setModel] = useState(skill.model);
  const [temperature, setTemperature] = useState(String(skill.temperature));
  const [maxTokens, setMaxTokens] = useState(String(skill.maxTokens));
  const [filePath, setFilePath] = useState(skill.filePath);
  const [changeNote, setChangeNote] = useState("");
  const [versions, setVersions] = useState(initialVersions);
  const [fromId, setFromId] = useState(initialVersions[1]?.id ?? initialVersions[0]?.id ?? "");
  const [toId, setToId] = useState(initialVersions[0]?.id ?? "");
  const [diff, setDiff] = useState("");
  const [versionBody, setVersionBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/skills/${skill.id}`).then(async (response) => {
        const payload = (await response.json()) as {
          ok: boolean;
          message?: string;
          skill?: SkillWithPrompt;
        };
        if (!response.ok || !payload.ok || !payload.skill) {
          throw new Error(payload.message ?? "无法读取 Skill 正文");
        }
        return payload.skill;
      }),
      fetch(`/api/skills/${skill.id}/versions`).then(async (response) => {
        const payload = (await response.json()) as { ok?: boolean; versions?: SkillVersion[] };
        return payload.versions ?? [];
      }),
    ])
      .then(([detail, nextVersions]) => {
        if (cancelled) {
          return;
        }
        setPrompt(detail.systemPrompt ?? "");
        setDescription(detail.description);
        setModel(detail.model);
        setTemperature(String(detail.temperature));
        setMaxTokens(String(detail.maxTokens));
        setFilePath(detail.filePath);
        setVersions(nextVersions);
        setFromId(nextVersions[1]?.id ?? nextVersions[0]?.id ?? "");
        setToId(nextVersions[0]?.id ?? "");
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "读取失败");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [skill.id]);

  async function saveVersion() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/skills/${skill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt: prompt,
          changeNote,
          filePath,
          description,
          model,
          temperature: Number(temperature),
          maxTokens: Number(maxTokens),
        }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "保存失败，旧版本已保留");
      }
      const versionsResponse = await fetch(`/api/skills/${skill.id}/versions`);
      const versionsPayload = (await versionsResponse.json()) as { versions?: SkillVersion[] };
      setVersions(versionsPayload.versions ?? []);
      setSuccess("已保存到服务端。刷新后仍生效。");
      toast.success("版本已保存");
      onSaved();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "保存失败，旧版本已保留";
      setError(message);
      toast.error("保存失败", { description: message });
    } finally {
      setSaving(false);
    }
  }

  async function loadDiff() {
    if (!fromId || !toId) {
      toast.error("请选择两个版本再查看 diff");
      return;
    }
    try {
      const response = await fetch(
        `/api/skills/${skill.id}/versions/diff?fromId=${encodeURIComponent(fromId)}&toId=${encodeURIComponent(toId)}`,
      );
      const payload = (await response.json()) as { ok: boolean; message?: string; diff?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "无法生成 diff");
      }
      setDiff(payload.diff ?? "");
    } catch (caught) {
      toast.error("查看 diff 失败", {
        description: caught instanceof Error ? caught.message : "请重试",
      });
    }
  }

  async function viewVersion(versionId: string) {
    try {
      const response = await fetch(`/api/skills/${skill.id}/versions/${versionId}`);
      const payload = (await response.json()) as {
        ok?: boolean;
        version?: SkillVersion;
        message?: string;
      };
      if (!response.ok || !payload.version) {
        throw new Error(payload.message ?? "无法读取版本正文");
      }
      setVersionBody(payload.version.body);
    } catch (caught) {
      toast.error("读取版本失败", {
        description: caught instanceof Error ? caught.message : "请重试",
      });
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>编辑 {skill.name}</CardTitle>
          <CardDescription>
            PUT /api/skills/{skill.id} 会先写版本快照。路径必须位于 skills/，写入 ../../ 会被拒绝。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <AdminLoading label="正在读取 Prompt 正文" /> : null}
          {error ? <AdminError message={error} /> : null}
          {success ? <AdminSuccess message={success} /> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">描述</span>
              <Input value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">模型</span>
              <Input value={model} onChange={(event) => setModel(event.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">温度</span>
              <Input value={temperature} onChange={(event) => setTemperature(event.target.value)} />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">Token 上限</span>
              <Input value={maxTokens} onChange={(event) => setMaxTokens(event.target.value)} />
            </label>
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
          <p className="text-xs break-words text-muted-foreground">
            依赖工具：{skill.requiredTools.join("、") || "无"}
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
          <CardTitle>版本、正文与 diff</CardTitle>
          <CardDescription>GET versions / versions/[id] / versions/diff，刷新后仍在。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {versions.length === 0 ? (
            <EmptyState title="暂无版本快照" description="保存一次后会出现 createdAt、changeNote 和 hash。" />
          ) : (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">对比起点</span>
                  <select
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm"
                    value={fromId}
                    onChange={(event) => setFromId(event.target.value)}
                  >
                    {versions.map((version) => (
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
                    {versions.map((version) => (
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
                <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs break-words whitespace-pre-wrap">
                  {diff}
                </pre>
              ) : null}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>版本</TableHead>
                      <TableHead>说明</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((version) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-mono text-xs">
                          {version.version}
                          <div className="text-muted-foreground">{version.hash}</div>
                        </TableCell>
                        <TableCell className="min-w-40">
                          <div className="break-words">{version.changeNote}</div>
                          <div className="text-xs text-muted-foreground">{version.createdAt}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void viewVersion(version.id)}
                          >
                            正文
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {versionBody ? (
                <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs break-words whitespace-pre-wrap">
                  {versionBody}
                </pre>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
