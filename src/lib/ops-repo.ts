import "server-only";

import {
  abTestsCollectionSchema,
  annotationsCollectionSchema,
  evalBatchesCollectionSchema,
  evalCasesCollectionSchema,
  improvementsCollectionSchema,
  llmConfigSchema,
  ratingsCollectionSchema,
  runsCollectionSchema,
  runtimeFallbackSchema,
  skillVersionsCollectionSchema,
  skillsCollectionSchema,
  ticketsCollectionSchema,
  toolsCollectionSchema,
  toolsConfigSchema,
} from "@/lib/schemas";
import { readJson } from "@/lib/store";
import type {
  AbTest,
  AgentRun,
  Annotation,
  Collection,
  EvalBatch,
  EvalCase,
  Improvement,
  LlmConfig,
  Rating,
  RuntimeFallback,
  Skill,
  SkillVersion,
  Ticket,
  Tool,
  ToolsConfig,
} from "@/lib/types";

export function listTickets(): Promise<Collection<Ticket>> {
  return readJson("tickets.json", ticketsCollectionSchema);
}

export function listSkills(): Promise<Collection<Skill>> {
  return readJson("skills.json", skillsCollectionSchema);
}

export function listTools(): Promise<Collection<Tool>> {
  return readJson("tools.json", toolsCollectionSchema);
}

export function getToolsConfig(): Promise<ToolsConfig> {
  return readJson("tools-config.json", toolsConfigSchema);
}

export function listSkillVersions(): Promise<Collection<SkillVersion>> {
  return readJson("skill-versions.json", skillVersionsCollectionSchema);
}

export function listRuns(): Promise<Collection<AgentRun>> {
  return readJson("runs.json", runsCollectionSchema);
}

export function listRatings(): Promise<Collection<Rating>> {
  return readJson("ratings.json", ratingsCollectionSchema);
}

export function listAnnotations(): Promise<Collection<Annotation>> {
  return readJson("annotations.json", annotationsCollectionSchema);
}

export function listImprovements(): Promise<Collection<Improvement>> {
  return readJson("improvements.json", improvementsCollectionSchema);
}

export function listEvalCases(): Promise<Collection<EvalCase>> {
  return readJson("eval_cases.json", evalCasesCollectionSchema);
}

export function listEvalBatches(): Promise<Collection<EvalBatch>> {
  return readJson("eval_batches.json", evalBatchesCollectionSchema);
}

export function listAbTests(): Promise<Collection<AbTest>> {
  return readJson("ab-tests.json", abTestsCollectionSchema);
}

export function getLlmConfig(): Promise<LlmConfig> {
  return readJson("llm-config.json", llmConfigSchema);
}

export function getRuntimeFallback(): Promise<RuntimeFallback> {
  return readJson("runtime-fallback.json", runtimeFallbackSchema);
}
