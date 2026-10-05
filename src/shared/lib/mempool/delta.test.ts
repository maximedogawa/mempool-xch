import { describe, expect, test } from "bun:test";
import { applyMempoolDelta } from "./delta";
import type { CompactMempoolItem, MempoolSummary } from "./types";

const item = (id: string) => ({ id }) as CompactMempoolItem;
const summary = (ids: string[]) =>
  ({ generatedAt: 1, source: "browser", items: ids.map(item) }) as MempoolSummary;

describe("applyMempoolDelta", () => {
  test("adds what entered, drops what left, keeps the rest as it was", () => {
    const before = summary(["a", "b", "c"]);
    const after = applyMempoolDelta(before, [item("d")], ["b"], 9);
    expect(after.items.map((i) => i.id)).toEqual(["a", "c", "d"]);
    expect(after.items[0]).toBe(before.items[0]!);
    expect(after.generatedAt).toBe(9);
  });

  test("a delta that changes nothing returns the same summary", () => {
    const before = summary(["a"]);
    expect(applyMempoolDelta(before, [item("a")], ["zz"])).toBe(before);
    // Entered and left within one frame: never shown.
    expect(applyMempoolDelta(before, [item("x")], ["x"])).toBe(before);
  });
});
