import { describe, expect, test } from "bun:test";
import { squarify } from "@/shared/lib/treemap";

describe("squarify", () => {
  test("empty and zero weights give no cells", () => {
    expect(squarify([], 100, 100)).toEqual([]);
    expect(squarify([{ item: "a", weight: 0 }], 100, 100)).toEqual([]);
    expect(squarify([{ item: "a", weight: 5 }], 0, 100)).toEqual([]);
  });
  test("a single item fills the rectangle", () => {
    const [cell] = squarify([{ item: "a", weight: 7 }], 200, 100);
    expect(cell).toMatchObject({ item: "a", x: 0, y: 0 });
    expect(cell!.width).toBeCloseTo(200, 5);
    expect(cell!.height).toBeCloseTo(100, 5);
  });
  test("areas are proportional to weights and cover the rectangle without overlap", () => {
    const inputs = [
      { item: "a", weight: 6 },
      { item: "b", weight: 6 },
      { item: "c", weight: 4 },
      { item: "d", weight: 3 },
      { item: "e", weight: 2 },
      { item: "f", weight: 2 },
      { item: "g", weight: 1 },
    ];
    const cells = squarify(inputs, 600, 400);
    expect(cells.length).toBe(7);
    const total = 24;
    cells.forEach((c) => {
      const w = inputs.find((i) => i.item === c.item)!.weight;
      expect(c.width * c.height).toBeCloseTo((w / total) * 600 * 400, 3);
      expect(c.x).toBeGreaterThanOrEqual(-1e-6);
      expect(c.y).toBeGreaterThanOrEqual(-1e-6);
      expect(c.x + c.width).toBeLessThanOrEqual(600 + 1e-6);
      expect(c.y + c.height).toBeLessThanOrEqual(400 + 1e-6);
    });
    const area = cells.reduce((s, c) => s + c.width * c.height, 0);
    expect(area).toBeCloseTo(600 * 400, 3);
    // No pairwise overlap.
    cells.forEach((a, i) =>
      cells.slice(i + 1).forEach((b) => {
        const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
        expect(Math.min(overlapX, overlapY)).toBeLessThanOrEqual(1e-6);
      })
    );
  });
  test("cells are reasonably square (the point of squarifying)", () => {
    const inputs = Array.from({ length: 12 }, (_, i) => ({ item: i, weight: 12 - i }));
    const cells = squarify(inputs, 400, 300);
    const worst = Math.max(...cells.map((c) => Math.max(c.width / c.height, c.height / c.width)));
    expect(worst).toBeLessThan(4);
  });
  test("input order keeps the caller's sequence and still tiles the rectangle", () => {
    const inputs = [
      { item: "small", weight: 1 },
      { item: "big", weight: 8 },
      { item: "mid", weight: 3 },
    ];
    const cells = squarify(inputs, 300, 200, { order: "input" });
    expect(cells.map((c) => c.item)).toEqual(["small", "big", "mid"]);
    const area = cells.reduce((s, c) => s + c.width * c.height, 0);
    expect(area).toBeCloseTo(300 * 200, 3);
    expect(squarify(inputs, 300, 200).map((c) => c.item)).toEqual(["big", "mid", "small"]);
  });
});
