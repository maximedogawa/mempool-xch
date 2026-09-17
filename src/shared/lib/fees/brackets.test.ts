import { describe, expect, test } from "bun:test";
import { bracketDistribution, bracketFor, RATE_BRACKETS } from "./brackets";

describe("bracketFor", () => {
  test("zero is its own bracket, not folded into 0-1", () => {
    expect(bracketFor(0).id).toBe("zero");
    expect(bracketFor(-1).id).toBe("zero"); // never negative in practice, but should not throw/misclassify
  });
  test("boundaries are inclusive on the lower edge", () => {
    expect(bracketFor(0.5).id).toBe("0-1");
    expect(bracketFor(1).id).toBe("1-3");
    expect(bracketFor(3).id).toBe("3-5");
    expect(bracketFor(5).id).toBe("5-10");
    expect(bracketFor(10).id).toBe("10-25");
    expect(bracketFor(25).id).toBe("25-50");
    expect(bracketFor(50).id).toBe("50+");
    expect(bracketFor(1000).id).toBe("50+");
  });
});

describe("bracketDistribution", () => {
  test("zero-fills every bracket, counts and sums cost only where items land", () => {
    const items = [
      { feeRate: 0, cost: 100 },
      { feeRate: 0, cost: 50 },
      { feeRate: 0.5, cost: 200 },
      { feeRate: 7, cost: 300 },
      { feeRate: 7, cost: 300 },
      { feeRate: 999, cost: 1 },
    ];
    const rows = bracketDistribution(items);
    expect(rows).toHaveLength(RATE_BRACKETS.length);
    expect(rows.find((r) => r.bracket.id === "zero")).toMatchObject({ count: 2, cost: 150 });
    expect(rows.find((r) => r.bracket.id === "0-1")).toMatchObject({ count: 1, cost: 200 });
    expect(rows.find((r) => r.bracket.id === "5-10")).toMatchObject({ count: 2, cost: 600 });
    expect(rows.find((r) => r.bracket.id === "50+")).toMatchObject({ count: 1, cost: 1 });
    expect(rows.find((r) => r.bracket.id === "1-3")).toMatchObject({ count: 0, cost: 0 });
  });
  test("empty mempool is every bracket at zero", () => {
    const rows = bracketDistribution([]);
    expect(rows.every((r) => r.count === 0 && r.cost === 0)).toBe(true);
  });
});
