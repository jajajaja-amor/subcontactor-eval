import "server-only";

import { runRecordsCollectionSchema } from "@/lib/schemas";
import { readJson, updateJson } from "@/lib/store";
import type { Collection, RunRecord } from "@/lib/types";

function nowIso() {
  return new Date().toISOString();
}

export function listRunRecords(): Promise<Collection<RunRecord>> {
  return readJson("run-records.json", runRecordsCollectionSchema);
}

export async function getRunRecord(id: string): Promise<RunRecord | null> {
  const all = await listRunRecords();
  return all.items.find((item) => item.id === id) ?? null;
}

export async function saveRunRecord(record: RunRecord): Promise<RunRecord> {
  const updated = await updateJson("run-records.json", runRecordsCollectionSchema, (current) => {
    const index = current.items.findIndex((item) => item.id === record.id);
    const items =
      index >= 0
        ? current.items.map((item) => (item.id === record.id ? record : item))
        : [record, ...current.items];
    return { updatedAt: nowIso(), items };
  });
  return updated.items.find((item) => item.id === record.id)!;
}
