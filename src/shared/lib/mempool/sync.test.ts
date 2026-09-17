import { describe, expect, test } from "bun:test";
import { createMempoolItemSync } from "./sync";
import type { MempoolItem } from "@/shared/lib/rpc/types";

function fakeItem(name: string): MempoolItem {
  return { name, fee: 0n, cost: 1, additions: [], removals: [], spendBundle: { coinSpends: [], aggregatedSignature: "" } };
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
      now: () => 1,
    });
    expect((await sync.sync()).length).toBe(0);
    fail = false;
    expect((await sync.sync()).length).toBe(1);
  });
});
