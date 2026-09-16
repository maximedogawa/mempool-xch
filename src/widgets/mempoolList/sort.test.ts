import { describe, expect, test } from "bun:test";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import { sortMempoolItems } from "./sort";

function item(id: string, fee: string, cost: number, firstSeen: number): CompactMempoolItem {
  return { id, fee, cost, feeRate: Number(fee) / cost, spends: 1, additions: [], removals: [], additionCount: 0, removalCount: 0, assets: { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0 }, firstSeen, kind: "xch", assetIds: [] };
}
const items = [item("a", "0", 100, 3), item("b", "50", 10, 1), item("c", "100", 1000, 2)];

describe("sortMempoolItems", () => {
  test("by fee rate, fee, cost and age in both directions", () => {
    expect(sortMempoolItems(items, "feeRate", "desc").map((i) => i.id)).toEqual(["b", "c", "a"]);
    expect(sortMempoolItems(items, "fee", "asc").map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(sortMempoolItems(items, "cost", "desc").map((i) => i.id)).toEqual(["c", "a", "b"]);
    expect(sortMempoolItems(items, "age", "asc").map((i) => i.id)).toEqual(["a", "c", "b"]);
    expect(sortMempoolItems(items, "age", "desc").map((i) => i.id)).toEqual(["b", "c", "a"]);
  });
  test("bigint fees beyond 2^53 sort correctly and ties are stable", () => {
    const big = [item("y", "9007199254740993", 1, 0), item("x", "9007199254740992", 1, 0), item("z", "9007199254740993", 1, 0)];
    expect(sortMempoolItems(big, "fee", "desc").map((i) => i.id)).toEqual(["y", "z", "x"]);
    expect(sortMempoolItems(items, "feeRate", "asc")).not.toBe(items);
  });
});
