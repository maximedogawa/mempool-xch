import { describe, expect, test } from "bun:test";
import type { TokenMarket, TokenMarketMap } from "@/shared/lib/tokens/markets";
import {
  allocationSlices,
  mergeHoldings,
  unitsOf,
  valuePortfolio,
  type Holding,
} from "./valuation";

const id = (c: string) => c.repeat(64);

function market(assetId: string, lastPriceXch: number | null): TokenMarket {
  return {
    assetId,
    lastPriceXch,
    volumeXch: { d1: 0, d7: 0, d30: 0 },
    bidXch: null,
    askXch: null,
    high30dXch: null,
    low30dXch: null,
  };
}

const xch = (whole: bigint): Holding => ({
  kind: "xch",
  assetId: null,
  amount: whole * 10n ** 12n,
  precision: 12,
});
const cat = (c: string, units: bigint): Holding => ({
  kind: "cat",
  assetId: id(c),
  amount: units * 1000n,
  precision: 3,
});

describe("unitsOf", () => {
  test("keeps the fraction and whole amounts past 2^53 mojos", () => {
    expect(unitsOf(1_500n, 3)).toBe(1.5);
    expect(unitsOf(12_345_000_000_000_000_001n, 12)).toBeCloseTo(12_345_000, 3);
  });
});

describe("valuePortfolio", () => {
  const markets: TokenMarketMap = {
    [id("a")]: market(id("a"), 0.01),
    [id("b")]: market(id("b"), null),
  };

  test("values XCH at 1, CATs at their Dexie price, and sorts by value", () => {
    const s = valuePortfolio([cat("a", 500n), xch(10n)], markets, { usd: 2, change24h: null });
    expect(s.rows.map((r) => r.key)).toEqual(["xch", `cat:${id("a")}`]);
    expect(s.totalXch).toBeCloseTo(15, 10);
    expect(s.totalUsd).toBeCloseTo(30, 10);
    expect(s.rows[1]!.share).toBeCloseTo(5 / 15, 10);
    expect(s.largest?.key).toBe("xch");
  });

  test("an unpriced CAT is unknown, not zero, and stays out of the totals", () => {
    const s = valuePortfolio([xch(1n), cat("b", 1_000n), cat("c", 5n)], markets, null);
    expect(s.totalXch).toBe(1);
    expect(s.totalUsd).toBeNull();
    expect(s.unpricedCount).toBe(2);
    const unpriced = s.rows.filter((r) => r.valueXch === null);
    expect(unpriced.map((r) => r.assetId)).toEqual([id("b"), id("c")]);
    expect(unpriced.every((r) => r.share === null)).toBe(true);
  });

  test("the 24-hour change is the USD moved by XCH's own change", () => {
    const s = valuePortfolio([xch(10n)], {}, { usd: 1.1, change24h: 0.1 });
    expect(s.totalUsd).toBeCloseTo(11, 10);
    expect(s.change24hUsd).toBeCloseTo(1, 10);
    expect(s.change24h).toBe(0.1);
  });

  test("empty and zero balances give an empty portfolio", () => {
    const s = valuePortfolio([{ ...xch(0n) }], {}, { usd: 2, change24h: 0.1 });
    expect(s.rows).toEqual([]);
    expect(s.totalXch).toBe(0);
    expect(s.largest).toBeNull();
    expect(allocationSlices(s)).toEqual([]);
  });
});

describe("mergeHoldings", () => {
  test("sums the same asset across sources and keeps the first known name", () => {
    const merged = mergeHoldings([
      [xch(1n), { ...cat("a", 2n), name: null }],
      [xch(2n), { ...cat("a", 3n), name: "Token A" }],
    ]);
    expect(merged).toHaveLength(2);
    expect(merged[0]!.amount).toBe(3n * 10n ** 12n);
    expect(merged[1]!.amount).toBe(5_000n);
    expect(merged[1]!.name).toBe("Token A");
  });
});

describe("allocationSlices", () => {
  test("XCH keeps slot 0, four tokens take slots 1-4, the rest fold into Other", () => {
    const letters = ["a", "b", "c", "d", "e", "f"];
    const markets = Object.fromEntries(letters.map((c) => [id(c), market(id(c), 1)]));
    const holdings = [xch(1n), ...letters.map((c, i) => cat(c, BigInt(10 - i)))];
    const slices = allocationSlices(valuePortfolio(holdings, markets, null));
    expect(slices.map((s) => s.slot)).toEqual([0, 1, 2, 3, 4, "other"]);
    expect(slices[1]!.holding?.assetId).toBe(id("a"));
    const other = slices.at(-1)!;
    expect(other.count).toBe(2);
    expect(other.valueXch).toBe(6 + 5);
    expect(slices.reduce((sum, s) => sum + s.share, 0)).toBeCloseTo(1, 10);
  });

  test("a wallet without XCH starts the tokens at slot 1", () => {
    const markets = { [id("a")]: market(id("a"), 2) };
    const slices = allocationSlices(valuePortfolio([cat("a", 1n)], markets, null));
    expect(slices).toHaveLength(1);
    expect(slices[0]!.slot).toBe(1);
    expect(slices[0]!.share).toBe(1);
  });
});
