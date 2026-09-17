import { describe, expect, test } from "bun:test";
import { bucketHeight, heightWindows, oldestHeightForRange, rangeById, RANGES } from "./range";

describe("rangeById", () => {
  test("finds by id, falls back to 24h", () => {
    expect(rangeById("7d").ms).toBe(7 * 24 * 60 * 60 * 1000);
    expect(rangeById("bogus" as never)).toBe(RANGES[1]!);
  });
});

describe("oldestHeightForRange", () => {
  test("6h at 18.75s per block is 0 blocks short of 1152", () => {
    const oldest = oldestHeightForRange(10_000, rangeById("6h"), 18.75);
    expect(10_000 - oldest).toBe(Math.ceil((6 * 60 * 60) / 18.75));
  });
  test("all range is height 0", () => {
    expect(oldestHeightForRange(10_000, rangeById("all"), 18.75)).toBe(0);
  });
  test("never negative for a peak below the range's block count", () => {
    expect(oldestHeightForRange(10, rangeById("1y"), 18.75)).toBe(0);
  });
});

describe("bucketHeight", () => {
  test("rounds down to the bucket size, stable for the query key across new blocks", () => {
    expect(bucketHeight(9_304_738, 50)).toBe(9_304_700);
    expect(bucketHeight(9_304_749, 50)).toBe(9_304_700);
    expect(bucketHeight(9_304_750, 50)).toBe(9_304_750);
    expect(bucketHeight(9_304_738)).toBe(9_304_700); // default size 50
  });
});

describe("heightWindows", () => {
  test("a short span (step <= sampleSize) is covered fully, contiguous", () => {
    const windows = heightWindows(1000, 0, 10, 200); // step 100 < sampleSize 200
    expect(windows.length).toBeLessThanOrEqual(11);
    expect(windows[0]!.start).toBe(0);
    expect(windows[windows.length - 1]!.end).toBe(1001);
    for (let i = 1; i < windows.length; i += 1) expect(windows[i]!.start).toBe(windows[i - 1]!.end);
  });
  test("a long span is sampled, not fully covered: each window is at most sampleSize wide", () => {
    // 1 year of blocks at windows=24 (real RangeDef for "1y"): step is huge, sampleSize caps it.
    const oldest = 9_000_000 - 1_681_920;
    const windows = heightWindows(9_000_000, oldest, 24, 120);
    expect(windows.length).toBeLessThanOrEqual(25);
    const totalFetched = windows.reduce((sum, w) => sum + (w.end - w.start), 0);
    expect(totalFetched).toBeLessThanOrEqual(25 * 120);
    windows.forEach((w) => expect(w.end - w.start).toBeLessThanOrEqual(120));
    // gaps between samples: not contiguous once step exceeds sampleSize
    expect(windows[1]!.start).toBeGreaterThan(windows[0]!.end);
  });
  test("a zero-span range is one window, capped at sampleSize", () => {
    expect(heightWindows(5, 5, 10, 120)).toEqual([{ start: 0, end: 6 }]);
    expect(heightWindows(200, 200, 10, 120)).toEqual([{ start: 81, end: 201 }]);
  });
});
