import "server-only";

import { storeTestRecordSchema } from "@/lib/schemas";
import {
  inspectDataFile,
  readJson,
  updateJson,
  writeJson,
} from "@/lib/store";
import type { StoreTestRecord } from "@/lib/types";

const STORE_TEST_FILE = "store-test.json";
const WORKERS = 8;

function emptyRecord(lastAction: string): StoreTestRecord {
  return {
    counter: 0,
    history: [],
    lastAction,
    updatedAt: new Date().toISOString(),
  };
}

export async function runStoreLockTest() {
  await writeJson(
    STORE_TEST_FILE,
    storeTestRecordSchema,
    emptyRecord("reset-before-lock-test"),
  );

  const startedAt = Date.now();
  await Promise.all(
    Array.from({ length: WORKERS }, (_, index) =>
      updateJson(STORE_TEST_FILE, storeTestRecordSchema, async (current) => {
        await new Promise((resolve) => setTimeout(resolve, 15));
        return {
          counter: current.counter + 1,
          history: [...current.history, index],
          lastAction: `worker-${index}`,
          updatedAt: new Date().toISOString(),
        };
      }),
    ),
  );

  const result = await readJson(STORE_TEST_FILE, storeTestRecordSchema);
  const uniqueHistory = new Set(result.history);

  return {
    ok: result.counter === WORKERS && uniqueHistory.size === WORKERS,
    expected: WORKERS,
    counter: result.counter,
    history: result.history,
    uniqueHistory: uniqueHistory.size,
    elapsedMs: Date.now() - startedAt,
    lock: "process-level-mutex",
    lastAction: result.lastAction,
  };
}

export async function runAtomicFailureTest() {
  const before = await writeJson(
    STORE_TEST_FILE,
    storeTestRecordSchema,
    {
      counter: 41,
      history: [41],
      lastAction: "seed-before-atomic-fail",
      updatedAt: new Date().toISOString(),
    },
  );

  let failedAsExpected = false;
  try {
    await writeJson(
      STORE_TEST_FILE,
      storeTestRecordSchema,
      {
        counter: 99,
        history: [99],
        lastAction: "should-not-commit",
        updatedAt: new Date().toISOString(),
      },
      { throwBeforeRename: true },
    );
  } catch {
    failedAsExpected = true;
  }

  const after = await readJson(STORE_TEST_FILE, storeTestRecordSchema);
  const preserved =
    after.counter === before.counter &&
    after.lastAction === before.lastAction &&
    JSON.stringify(after.history) === JSON.stringify(before.history);

  return {
    ok: failedAsExpected && preserved,
    failedAsExpected,
    preserved,
    before,
    after,
    atomic: "temp-file-then-rename",
  };
}

export async function getStoreTestSnapshot() {
  const info = await inspectDataFile(STORE_TEST_FILE);
  if (!info.exists) {
    return { exists: false, record: null as StoreTestRecord | null };
  }

  return {
    exists: true,
    record: await readJson(STORE_TEST_FILE, storeTestRecordSchema),
  };
}
