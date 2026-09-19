import { describe, expect, test } from "bun:test";
import {
  loadSnapshot,
  saveSnapshot,
  SNAPSHOT_KEY_PREFIX,
  SNAPSHOT_MAX_AGE_MS,
  SNAPSHOT_MAX_ITEMS,
} from "./snapshot";
import type { CompactMempoolItem, MempoolSummary } from "./types";

function item(id: string, feeRate: number): CompactMempoolItem {
  return {
    id,
    fee: "1",
    cost: 1,
    feeRate,
    spends: 1,
    additions: [],
    removals: [],
    additionCount: 0,
    removalCount: 0,
    assets: { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0 },
    firstSeen: 1,
    kind: "xch",
    assetIds: [],
  };
}

function summary(items: CompactMempoolItem[], generatedAt = 1_000): MempoolSummary {
  return {
    network: "mainnet",
    generatedAt,
    source: "browser",
    state: {
      peakHeight: 1,
      peakHash: "",
      lastTxBlockHeight: 1,
      mempoolSize: items.length,
      mempoolCost: 0,
      mempoolMaxTotalCost: 0,
      mempoolFees: "0",
      blockMaxCost: 11_000_000_000,
      averageBlockTime: 18,
      minFeeRate: 0,
      synced: true,
    },
    items,
  };
}

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("mempool snapshot", () => {
  test("round-trips a summary per network", () => {
    const storage = memoryStorage();
    saveSnapshot(storage, summary([item("a", 5)]));
    expect(loadSnapshot(storage, "mainnet", 2_000)?.items.map((i) => i.id)).toEqual(["a"]);
    expect(loadSnapshot(storage, "testnet11", 2_000)).toBeNull();
  });

  test("keeps at most SNAPSHOT_MAX_ITEMS, the highest fee rates", () => {
    const storage = memoryStorage();
    const items = Array.from({ length: SNAPSHOT_MAX_ITEMS + 50 }, (_, i) => item(`i${i}`, i));
    saveSnapshot(storage, summary(items));
    const loaded = loadSnapshot(storage, "mainnet", 2_000)!;
    expect(loaded.items.length).toBe(SNAPSHOT_MAX_ITEMS);
    expect(Math.min(...loaded.items.map((i) => i.feeRate))).toBe(50);
  });

  test("ignores snapshots that are too old, malformed or carry broken items", () => {
    const storage = memoryStorage();
    saveSnapshot(storage, summary([item("a", 1)], 1_000));
    expect(loadSnapshot(storage, "mainnet", 1_000 + SNAPSHOT_MAX_AGE_MS + 1)).toBeNull();
    storage.data.set(`${SNAPSHOT_KEY_PREFIX}mainnet`, "{not json");
    expect(loadSnapshot(storage, "mainnet", 2_000)).toBeNull();
    storage.data.set(
      `${SNAPSHOT_KEY_PREFIX}mainnet`,
      JSON.stringify({ ...summary([item("a", 1)]), items: [item("a", 1), { id: 7 }, null] })
    );
    expect(loadSnapshot(storage, "mainnet", 2_000)?.items.map((i) => i.id)).toEqual(["a"]);
  });

  test("a full storage drops the old snapshot instead of keeping it", () => {
    const storage = memoryStorage();
    saveSnapshot(storage, summary([item("old", 1)]));
    const full = {
      ...storage,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    saveSnapshot(full, summary([item("new", 1)]));
    expect(loadSnapshot(storage, "mainnet", 2_000)).toBeNull();
  });
});
