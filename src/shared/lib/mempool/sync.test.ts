import { describe, expect, test } from "bun:test";
import { createMempoolItemSync } from "./sync";
import type { MempoolItem } from "@/shared/lib/rpc/types";

function fakeItem(name: string): MempoolItem {
  return {
    name,
    fee: 0n,
    cost: 1,
    additions: [],
    removals: [],
    spendBundle: { coinSpends: [], aggregatedSignature: "" },
  };
}

describe("createMempoolItemSync", () => {
  test("fetches only new items on later syncs, drops ones that left the mempool", async () => {
    let idsCall = 0;
    const fetchedItemIds: string[] = [];
    const ids = [
      ["a", "b"],
      ["a", "b", "c"],
      ["b", "c"],
    ];
    const sync = createMempoolItemSync({
      getAllMempoolTxIds: async () => ids[idsCall++]!,
      getMempoolItemByTxId: async (id) => {
        fetchedItemIds.push(id);
        return fakeItem(id);
      },
      reduce: (item, firstSeen) => ({ item, firstSeen }),
      now: () => 1000,
    });

    const first = await sync.sync();
    expect(first.map((e) => e.item.name).sort()).toEqual(["a", "b"]);
    expect(fetchedItemIds).toEqual(["a", "b"]);

    const second = await sync.sync();
    expect(second.map((e) => e.item.name).sort()).toEqual(["a", "b", "c"]);
    expect(fetchedItemIds).toEqual(["a", "b", "c"]); // only "c" fetched, "a" and "b" reused

    const third = await sync.sync();
    expect(third.map((e) => e.item.name).sort()).toEqual(["b", "c"]); // "a" left the mempool
    expect(sync.size).toBe(2);
  });

  test("firstSeen is stable across refetches while an item stays", async () => {
    let tick = 0;
    const sync = createMempoolItemSync({
      getAllMempoolTxIds: async () => ["a"],
      getMempoolItemByTxId: async (id) => fakeItem(id),
      reduce: (item, firstSeen) => ({ item, firstSeen }),
      now: () => (tick += 1000),
    });
    const first = await sync.sync();
    const second = await sync.sync();
    expect(first[0]!.firstSeen).toBe(second[0]!.firstSeen);
  });

  test("an item that fails to fetch is skipped, not stuck forever", async () => {
    let fail = true;
    const sync = createMempoolItemSync({
      getAllMempoolTxIds: async () => ["a"],
      getMempoolItemByTxId: async (id) => {
        if (fail) throw new Error("transient");
        return fakeItem(id);
      },
      reduce: (item, firstSeen) => ({ item, firstSeen }),
      now: () => 1,
    });
    expect((await sync.sync()).length).toBe(0);
    fail = false;
    expect((await sync.sync()).length).toBe(1);
  });

  test("keeps only the reduced form, reduced once, as the same object across syncs", async () => {
    let reduced = 0;
    const sync = createMempoolItemSync({
      getAllMempoolTxIds: async () => ["a"],
      getMempoolItemByTxId: async (id) => fakeItem(id),
      reduce: (item) => {
        reduced += 1;
        return { id: item.name };
      },
    });
    const first = await sync.sync();
    const second = await sync.sync();
    expect(first[0]).toEqual({ id: "a" });
    expect(second[0]).toBe(first[0]!);
    expect(reduced).toBe(1);
  });

  test("seeded entries are not fetched again and leave once they are no longer live", async () => {
    const fetched: string[] = [];
    let ids = ["a", "b"];
    const sync = createMempoolItemSync({
      getAllMempoolTxIds: async () => ids,
      getMempoolItemByTxId: async (id) => {
        fetched.push(id);
        return fakeItem(id);
      },
      reduce: (item) => ({ id: item.name }),
      seed: [
        ["a", { id: "a" }],
        ["gone", { id: "gone" }],
      ],
    });
    expect((await sync.sync()).map((e) => e.id).sort()).toEqual(["a", "b"]);
    expect(fetched).toEqual(["b"]);
    ids = ["b"];
    expect((await sync.sync()).map((e) => e.id)).toEqual(["b"]);
  });

  test("reports progress about once a second while a large backlog is fetched", async () => {
    let clock = 0;
    const ids = Array.from({ length: 20 }, (_, i) => `id${i}`);
    const progress: number[] = [];
    const sync = createMempoolItemSync({
      getAllMempoolTxIds: async () => ids,
      getMempoolItemByTxId: async (id) => {
        clock += 400;
        return fakeItem(id);
      },
      reduce: (item) => ({ id: item.name }),
      now: () => clock,
      concurrency: 1,
    });
    const all = await sync.sync(undefined, (entries) => progress.push(entries.length));
    expect(all.length).toBe(20);
    expect(progress.length).toBeGreaterThan(3);
    expect(progress).toEqual([...progress].sort((a, b) => a - b));
    expect(progress[progress.length - 1]!).toBeLessThanOrEqual(20);

    // A handful of new ids is not worth intermediate updates.
    ids.push("late");
    const later: number[] = [];
    await sync.sync(undefined, (entries) => later.push(entries.length));
    expect(later).toEqual([]);
  });
});

test("aborting a catch-up stops queued requests and rejects instead of returning partial success", async () => {
  const controller = new AbortController();
  const fetched: string[] = [];
  const sync = createMempoolItemSync({
    concurrency: 1,
    getAllMempoolTxIds: async () => ["a", "b", "c"],
    getMempoolItemByTxId: async (id) => {
      fetched.push(id);
      controller.abort();
      return fakeItem(id);
    },
    reduce: (item) => item.name,
  });
  await expect(sync.sync(controller.signal)).rejects.toThrow();
  expect(fetched).toEqual(["a"]);
  expect(sync.size).toBe(0);
});

test("a superseded request cannot put removed items back in the cache", async () => {
  let resolve!: (item: MempoolItem) => void;
  let ids = ["old"];
  const sync = createMempoolItemSync({
    getAllMempoolTxIds: async () => ids,
    getMempoolItemByTxId: () =>
      new Promise<MempoolItem>((r) => {
        resolve = r;
      }),
    reduce: (item) => item.name,
  });
  const first = sync.sync();
  const rejected = first.catch((error: Error) => error);
  await Promise.resolve();
  ids = [];
  expect(await sync.sync()).toEqual([]);
  resolve(fakeItem("old"));
  expect(((await rejected) as Error).message).toBe("Superseded sync");
  expect(sync.size).toBe(0);
});
