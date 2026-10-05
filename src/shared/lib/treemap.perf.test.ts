import { describe, expect, test } from "bun:test";
import { squarify } from "./treemap";

describe("treemap performance", () => {
  test("lays out 500 cells in well under 100 ms", () => {
    const inputs = Array.from({ length: 500 }, (_, i) => ({
      item: i,
      weight: 1_000_000 + ((i * 7919) % 50_000_000),
    }));
    const started = performance.now();
    const cells = squarify(inputs, 800, 170);
    const ms = performance.now() - started;
    expect(cells.length).toBe(500);
    expect(ms).toBeLessThan(100);
    // Every cell inside the canvas, no negative sizes.
    cells.forEach((c) => {
      expect(c.x).toBeGreaterThanOrEqual(-0.01);
      expect(c.y).toBeGreaterThanOrEqual(-0.01);
      expect(c.x + c.width).toBeLessThanOrEqual(800.01);
      expect(c.y + c.height).toBeLessThanOrEqual(170.01);
    });
  });
});
