import { describe, expect, test } from "bun:test";
import { segmentsOf } from "./StackedAreaChart";

describe("segmentsOf", () => {
  test("samples a usual step apart are one run; a long silence starts another", () => {
    const t = [0, 10_000, 20_000, 30_000, 30_000 + 15 * 60_000, 30_000 + 15 * 60_000 + 10_000];
    expect(segmentsOf(t)).toEqual([
      [0, 1, 2, 3],
      [4, 5],
    ]);
  });

  test("slow sampling is not mistaken for gaps", () => {
    // A sample every 5 minutes: four steps is the gap, not the two-minute floor.
    const t = [0, 1, 2, 3].map((i) => i * 5 * 60_000);
    expect(segmentsOf(t)).toEqual([[0, 1, 2, 3]]);
    expect(segmentsOf([])).toEqual([]);
  });
});
