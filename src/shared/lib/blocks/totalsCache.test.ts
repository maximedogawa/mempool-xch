import { expect, test } from "bun:test";
import { EMPTY_TOTALS, type BlockAssetTotals } from "./assetTotals";
import {
  TOTALS_CACHE_KEY_PREFIX,
  TOTALS_CACHE_MAX_ENTRIES,
  loadCachedTotals,
  saveCachedTotals,
} from "./totalsCache";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    map,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
  };
}

const totals = (over: Partial<BlockAssetTotals> = {}): BlockAssetTotals => ({
  ...EMPTY_TOTALS,
  xch: "1500",
  count: 3,
  ...over,
});

test("totals round-trip per network, hash and source", () => {
  const storage = memoryStorage();
  saveCachedTotals(storage, "mainnet", { height: 10, hash: "0xAB" }, totals());
  expect(loadCachedTotals(storage, "mainnet", "0xab", "coinset")).toEqual(totals());
  expect(loadCachedTotals(storage, "mainnet", "0xab", "rpc")).toBeNull();
  expect(loadCachedTotals(storage, "testnet11", "0xab", "coinset")).toBeNull();
  expect(loadCachedTotals(storage, "mainnet", "0xcd", "coinset")).toBeNull();
});

test("empty totals are not pinned, the indexer may be lagging", () => {
  const storage = memoryStorage();
  saveCachedTotals(storage, "mainnet", { height: 10, hash: "ab" }, totals({ count: 0 }));
  expect(loadCachedTotals(storage, "mainnet", "ab", "coinset")).toBeNull();
});

test("the oldest blocks are dropped beyond the bound", () => {
  const storage = memoryStorage();
  for (let h = 0; h < TOTALS_CACHE_MAX_ENTRIES + 5; h++) {
    saveCachedTotals(storage, "mainnet", { height: h, hash: `h${h}` }, totals());
  }
  expect(loadCachedTotals(storage, "mainnet", "h0", "coinset")).toBeNull();
  expect(loadCachedTotals(storage, "mainnet", "h5", "coinset")).toEqual(totals());
});

test("corrupt or unusable storage reads as a miss", () => {
  const storage = memoryStorage();
  storage.map.set(`${TOTALS_CACHE_KEY_PREFIX}mainnet`, "{not json");
  expect(loadCachedTotals(storage, "mainnet", "ab", "coinset")).toBeNull();
  storage.map.set(`${TOTALS_CACHE_KEY_PREFIX}mainnet`, JSON.stringify({ ab: { totals: 1 } }));
  expect(loadCachedTotals(storage, "mainnet", "ab", "coinset")).toBeNull();
  expect(loadCachedTotals(null, "mainnet", "ab", "coinset")).toBeNull();
});
