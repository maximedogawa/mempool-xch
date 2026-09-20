import { describe, expect, test } from "bun:test";
import { createWatchlistStore } from "./store";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  } as Storage;
}

describe("watchlist store", () => {
  test("starts empty and adds normalised, deduplicated items", () => {
    const store = createWatchlistStore(memoryStorage());
    expect(store.get()).toEqual([]);
    store.add({ kind: "tx", id: "0xABCDEF", label: "abcdef…" });
    store.add({ kind: "tx", id: "abcdef", label: "duplicate, ignored" });
    expect(store.get()).toHaveLength(1);
    expect(store.get()[0]).toMatchObject({ kind: "tx", id: "abcdef" });
  });

  test("get() returns a stable reference until the list actually changes", () => {
    const store = createWatchlistStore(memoryStorage());
    const a = store.get();
    const b = store.get();
    expect(a).toBe(b);
    store.add({ kind: "address", id: "aa".repeat(32), label: "xch1…" });
    expect(store.get()).not.toBe(a);
  });

  test("remove() drops only the matching kind and id", () => {
    const store = createWatchlistStore(memoryStorage());
    store.add({ kind: "tx", id: "aa".repeat(32), label: "tx" });
    store.add({ kind: "address", id: "aa".repeat(32), label: "same hex, different kind" });
    store.remove("tx", "aa".repeat(32));
    expect(store.get()).toHaveLength(1);
    expect(store.get()[0]!.kind).toBe("address");
  });

  test("has() checks kind and id together", () => {
    const store = createWatchlistStore(memoryStorage());
    store.add({ kind: "address", id: "bb".repeat(32), label: "x" });
    expect(store.has("address", "BB".repeat(32))).toBe(true);
    expect(store.has("tx", "bb".repeat(32))).toBe(false);
  });

  test("persists across store instances sharing storage", () => {
    const storage = memoryStorage();
    const first = createWatchlistStore(storage);
    first.add({ kind: "tx", id: "cc".repeat(32), label: "x" });
    const second = createWatchlistStore(storage);
    expect(second.get()).toHaveLength(1);
  });

  test("keeps a watched DID, keyed by its launcher id, across a reload", () => {
    const storage = memoryStorage();
    const launcher = "73ef2c17b2ed1e979cb449ff28852c337018cd1f7e5e4b6abf1448e8d650a6d9";
    const didId = "did:chia:1w0hjc9aja50f0895f8lj3pfvxdcp3ngl0e0yk64lz3yw34js5mvstx2cnk";
    const first = createWatchlistStore(storage);
    first.add({ kind: "did", id: `0x${launcher.toUpperCase()}`, label: didId });
    expect(first.has("did", launcher)).toBe(true);
    // A DID and an address are separate entries even when the hex matches.
    expect(first.has("address", launcher)).toBe(false);
    const second = createWatchlistStore(storage);
    expect(second.get()).toEqual([
      expect.objectContaining({ kind: "did", id: launcher, label: didId }),
    ]);
  });

  test("drops persisted entries whose kind is not a watchable one", () => {
    const storage = memoryStorage();
    storage.setItem(
      "mempool-xch:watchlist:v1",
      JSON.stringify([
        { kind: "did", id: "dd".repeat(32), label: "did:chia:1…", addedAt: 1 },
        { kind: "nft", id: "ee".repeat(32), label: "nft1…", addedAt: 2 },
      ])
    );
    const store = createWatchlistStore(storage);
    expect(store.get().map((i) => i.kind)).toEqual(["did"]);
  });

  test("ignores malformed persisted data instead of throwing", () => {
    const storage = memoryStorage();
    storage.setItem("mempool-xch:watchlist:v1", "not json");
    const store = createWatchlistStore(storage);
    expect(store.get()).toEqual([]);
  });
});
