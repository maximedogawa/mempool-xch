import { describe, expect, test } from "bun:test";
import {
  areaPath,
  depthSeries,
  depthWindow,
  gridPrice,
  lerpSeries,
  linePath,
  stickyWindow,
  sumSeries,
} from "./depth";

const level = (price: number, amount: number) => ({
  priceScaled: BigInt(Math.round(price * 1e8)),
  amount,
});

describe("battlefield depth geometry", () => {
  const window = depthWindow(100_000_000n, 102_000_000n)!;

  test("window is ±2 % around the mid, wider when the gap is wider", () => {
    expect(window).toEqual({ mid: 101_000_000n, low: 98_980_000n, high: 103_020_000n });
    expect(depthWindow(100_000_000n, 110_000_000n)).toEqual({
      mid: 105_000_000n,
      low: 95_000_000n,
      high: 115_000_000n,
    });
    expect(depthWindow(null, 1n)).toBeNull();
  });

  test("the window holds still while the front line stays in its inner half", () => {
    expect(stickyWindow(window, 100_600_000n, 101_400_000n)).toBe(window);
    expect(stickyWindow(window, 101_600_000n, 102_400_000n)?.mid).toBe(102_000_000n);
    expect(stickyWindow(null, 100_000_000n, 102_000_000n)).toEqual(window);
    expect(stickyWindow(window, null, 1n)).toBeNull();
  });

  test("cumulative depth steps outward from the mid and ends where the book ends", () => {
    const bids = depthSeries([level(1.0, 2), level(0.995, 3)], "bids", window, 11);
    expect(gridPrice(window, "bids", 0, 11)).toBeCloseTo(1.01, 8);
    expect(bids[0]).toBe(0);
    expect(bids[5]).toBe(2); // grid 1.0000
    expect(bids[7]).toBe(2); // grid 0.9959, not yet at 0.995
    expect(bids[8]).toBe(5); // grid 0.9938, the last step
    expect(bids[9]).toBeNaN(); // deeper than the book goes
    const asks = depthSeries([level(1.02, 4)], "asks", window, 11);
    expect(asks[4]).toBe(0);
    expect(asks[5]).toBe(4);
    expect(asks[6]).toBeNaN();
    expect(depthSeries([], "asks", window, 3).every(Number.isNaN)).toBe(true);
  });

  test("aggregate keeps a finished book's total; tween snaps across gaps", () => {
    expect(
      sumSeries(
        [
          [0, 1, Number.NaN],
          [1, 1, 2],
        ],
        3
      )
    ).toEqual([1, 2, 3]);
    expect(lerpSeries([0, Number.NaN], [10, 5], 0.5)).toEqual([5, 5]);
    expect(lerpSeries(undefined, [1], 0.2)).toEqual([1]);
  });

  test("paths split at unknown depth", () => {
    const x = (i: number) => i * 10;
    const y = (v: number) => 100 - v;
    expect(linePath([0, 1, Number.NaN, 2], x, y)).toBe("M0.0,100.0L10.0,100.0L10.0,99.0M30.0,98.0");
    expect(areaPath([0, 1], x, y, 100)).toBe(
      "M0.0,100.0L0.0,100.0L10.0,100.0L10.0,99.0L10.0,100.0Z"
    );
  });
});
