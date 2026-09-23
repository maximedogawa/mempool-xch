import { describe, expect, test } from "bun:test";
import { createPoolClaimStore, isFresh, MAX_ENTRIES, STORAGE_KEY_PREFIX } from "./claimStore";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    data,
  };
}

const PAYOUT = "a".repeat(64);
const TARGET = "b".repeat(64);
const DAY = 24 * 60 * 60 * 1000;

describe("pool claim store", () => {
  test("persists claims per network and reads them back", () => {
    const storage = memoryStorage();
    createPoolClaimStore(storage).setMany(
      "mainnet",
      [[PAYOUT, { target: TARGET, selfPooled: true }]],
      1000
    );
    const reloaded = createPoolClaimStore(storage);
    expect(reloaded.get("mainnet").get(PAYOUT)).toEqual({
      target: TARGET,
      selfPooled: true,
      at: 1000,
    });
    expect(reloaded.get("testnet11").size).toBe(0);
  });

  test("a write produces a new snapshot and notifies subscribers", () => {
    const store = createPoolClaimStore(memoryStorage());
    const before = store.get("mainnet");
    let notified = 0;
    store.subscribe(() => (notified += 1));
    store.setMany("mainnet", [[PAYOUT, { target: null, selfPooled: false }]]);
    expect(store.get("mainnet")).not.toBe(before);
    expect(store.get("mainnet")).toBe(store.get("mainnet"));
    expect(notified).toBe(1);
  });

  test("ignores malformed storage instead of throwing", () => {
    const rows = {
      [PAYOUT]: [TARGET, 0, 5],
      nothex: [TARGET, 0, 5],
      ["c".repeat(64)]: ["<script>", 0, 5],
      ["d".repeat(64)]: "x",
    };
    const store = createPoolClaimStore(
      memoryStorage({ [`${STORAGE_KEY_PREFIX}mainnet`]: JSON.stringify(rows) })
    );
    expect([...store.get("mainnet").keys()]).toEqual([PAYOUT]);
    expect(
      createPoolClaimStore(memoryStorage({ [`${STORAGE_KEY_PREFIX}mainnet`]: "{not json" })).get(
        "mainnet"
      ).size
    ).toBe(0);
  });

  test("works without storage", () => {
    const store = createPoolClaimStore(null);
    store.setMany("mainnet", [[PAYOUT, { target: TARGET, selfPooled: false }]]);
    expect(store.get("mainnet").has(PAYOUT)).toBe(true);
  });

  test("a resolved claim stays fresh for two weeks, an unclaimed address for half a day", () => {
    expect(isFresh({ target: TARGET, selfPooled: false, at: 0 }, 13 * DAY)).toBe(true);
    expect(isFresh({ target: TARGET, selfPooled: false, at: 0 }, 15 * DAY)).toBe(false);
    expect(isFresh({ target: null, selfPooled: false, at: 0 }, DAY / 4)).toBe(true);
    expect(isFresh({ target: null, selfPooled: false, at: 0 }, DAY)).toBe(false);
  });

  test(`keeps at most ${MAX_ENTRIES} claims, dropping the oldest`, () => {
    const storage = memoryStorage();
    const store = createPoolClaimStore(storage);
    const hash = (i: number) => i.toString(16).padStart(64, "0");
    const claims = (from: number, to: number): [string, { target: null; selfPooled: false }][] =>
      Array.from({ length: to - from }, (_, k) => [
        hash(from + k),
        { target: null, selfPooled: false },
      ]);
    store.setMany("mainnet", claims(0, MAX_ENTRIES), 1000);
    store.setMany("mainnet", claims(MAX_ENTRIES, MAX_ENTRIES + 10), 2000);
    const kept = store.get("mainnet");
    expect(kept.size).toBe(MAX_ENTRIES);
    // The ten newest are all kept; ten of the older batch made room for them.
    expect(kept.has(hash(MAX_ENTRIES + 9))).toBe(true);
    expect([...kept.values()].filter((c) => c.at === 1000)).toHaveLength(MAX_ENTRIES - 10);
    expect(Object.keys(JSON.parse(storage.data.get(`${STORAGE_KEY_PREFIX}mainnet`)!))).toHaveLength(
      MAX_ENTRIES
    );
  });
});
