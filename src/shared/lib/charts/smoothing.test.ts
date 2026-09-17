import { describe, expect, test } from "bun:test";
import { smoothingById, smoothSeries, type Point } from "./smoothing";

const pts: Point[] = [0, 1, 2, 3, 4, 5, 6].map((i) => ({ t: i, v: i % 2 === 0 ? 0 : 10 })); // zigzag

describe("smoothingById", () => {
  test("falls back to raw", () => {
    expect(smoothingById("bogus" as never).id).toBe("raw");
  });
});

describe("smoothSeries", () => {
  test("window <= 1 or too few points returns the series unchanged", () => {
    expect(smoothSeries(pts, 1)).toEqual(pts);
    expect(smoothSeries([{ t: 0, v: 1 }], 3)).toEqual([{ t: 0, v: 1 }]);
  });
  test("smooths a zigzag toward the middle, timestamps untouched", () => {
    const out = smoothSeries(pts, 3);
    expect(out.map((p) => p.t)).toEqual(pts.map((p) => p.t));
    // interior points average 3 neighbours: (0+10+0)/3 or (10+0+10)/3
    expect(out[3]!.v).toBeCloseTo((pts[2]!.v + pts[3]!.v + pts[4]!.v) / 3, 6);
    // edges clamp: point 0 only has neighbours 0 and 1
    expect(out[0]!.v).toBeCloseTo((pts[0]!.v + pts[1]!.v) / 2, 6);
  });
  test("wider window smooths more", () => {
    const smooth = smoothSeries(pts, 3);
    const verySmooth = smoothSeries(pts, 7);
    const variance = (arr: Point[]) => {
      const mean = arr.reduce((s, p) => s + p.v, 0) / arr.length;
      return arr.reduce((s, p) => s + (p.v - mean) ** 2, 0) / arr.length;
    };
    expect(variance(verySmooth)).toBeLessThan(variance(smooth));
  });
});
