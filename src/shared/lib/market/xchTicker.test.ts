import { describe, expect, test } from "bun:test";
import { parseGateTicker } from "./xchTicker";

describe("parseGateTicker", () => {
  test("reads the last price and turns the percentage into a ratio", () => {
    const ticker = parseGateTicker([
      { currency_pair: "XCH_USDT", last: "1.621", change_percentage: "-2.5" },
    ]);
    expect(ticker.usd).toBe(1.621);
    expect(ticker.change24h).toBeCloseTo(-0.025, 10);
  });

  test("a missing change is null, not zero", () => {
    expect(parseGateTicker([{ last: "2", change_percentage: "" }]).change24h).toBeNull();
    expect(parseGateTicker([{ last: "2" }]).change24h).toBeNull();
  });

  test("rejects an answer without a usable price", () => {
    expect(() => parseGateTicker([])).toThrow();
    expect(() => parseGateTicker({ label: "INVALID_CURRENCY" })).toThrow();
    expect(() => parseGateTicker([{ last: "0" }])).toThrow();
  });
});
