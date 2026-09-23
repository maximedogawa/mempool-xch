import { describe, expect, test } from "bun:test";
import { gateCandlesUrl, parseGateCandles } from "./priceHistory";

describe("Gate.io price history", () => {
  test("one request per range, candle width scaled to the span", () => {
    expect(gateCandlesUrl("24h")).toBe(
      "https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=XCH_USDT&interval=15m&limit=96"
    );
    expect(gateCandlesUrl("1y")).toContain("interval=1d&limit=365");
  });
  test("close price per candle, oldest first, malformed rows skipped", () => {
    const body = [
      ["1758620700", "1234.5", "10.92", "10.95", "10.90", "10.91", "113.1", "true"],
      ["1758619800", "900.1", "10.88", "10.90", "10.80", "10.85", "82.7", "true"],
      ["bogus"],
      "not a row",
      ["1758621600", "10", "0", "0", "0", "0", "0", "false"],
    ];
    expect(parseGateCandles(body)).toEqual([
      { t: 1758619800_000, v: 10.88 },
      { t: 1758620700_000, v: 10.92 },
    ]);
    expect(() => parseGateCandles({ label: "INVALID_PARAM" })).toThrow();
  });
});
