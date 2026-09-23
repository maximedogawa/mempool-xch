import { expect, test } from "bun:test";
import {
  dexieNumber,
  fetchTokenMarkets,
  formatXchFigure,
  normaliseTickers,
  spreadRatio,
} from "./markets";

const SBX = "a628c1c2c6fcb74d53746157e438e108eab5c0bb3e5c80ff9b1910b3e4832913";

const ticker = {
  ticker_id: `${SBX}_xch`,
  base_currency: SBX,
  target_currency: "xch",
  last_price: "0.00038908",
  base_volume: "500",
  target_volume: "0.19454",
  base_volume_7d: "662.385",
  target_volume_7d: "0.25814",
  base_volume_30d: "5725019.719",
  target_volume_30d: "2210.91471451186",
  bid: "0.000377104384",
  ask: null,
  high_30d: "0.000478269301",
  low_30d: "0.00019243701",
};

test("volume is read from the XCH side of the pair, never the token amount", () => {
  const market = normaliseTickers({ success: true, tickers: [ticker] })[SBX]!;
  expect(market.volumeXch).toEqual({ d1: 0.19454, d7: 0.25814, d30: 2210.91471451186 });
  expect(market.lastPriceXch).toBe(0.00038908);
  expect(market.bidXch).toBe(0.000377104384);
  expect(market.askXch).toBeNull();
});

test("pairs not quoted in XCH, malformed ids and junk payloads are ignored", () => {
  expect(
    normaliseTickers({
      tickers: [
        { ...ticker, target_currency: "other" },
        { ...ticker, base_currency: "nothex" },
        null,
      ],
    })
  ).toEqual({});
  expect(normaliseTickers(null)).toEqual({});
  expect(normaliseTickers({ tickers: "no" })).toEqual({});
});

test("a zero last price means no price", () => {
  const map = normaliseTickers({ tickers: [{ ...ticker, last_price: "0" }] });
  expect(map[SBX]!.lastPriceXch).toBeNull();
});

test("dexieNumber", () => {
  expect(dexieNumber("1.5")).toBe(1.5);
  expect(dexieNumber(2)).toBe(2);
  expect(dexieNumber("")).toBeNull();
  expect(dexieNumber(null)).toBeNull();
  expect(dexieNumber("abc")).toBeNull();
});

test("fetchTokenMarkets makes one request and throws on an HTTP error", async () => {
  const urls: string[] = [];
  const ok = await fetchTokenMarkets(async (url) => {
    urls.push(url);
    return { ok: true, status: 200, json: async () => ({ tickers: [ticker] }) };
  });
  expect(Object.keys(ok)).toEqual([SBX]);
  expect(urls).toEqual(["https://api.dexie.space/v3/prices/tickers"]);
  await expect(
    fetchTokenMarkets(async () => ({ ok: false, status: 503, json: async () => ({}) }))
  ).rejects.toThrow("503");
});

test("formatXchFigure", () => {
  expect(formatXchFigure(0)).toBe("0");
  expect(formatXchFigure(2210.91471)).toBe("2,211");
  expect(formatXchFigure(9.97123)).toBe("9.97");
  expect(formatXchFigure(0.00038908)).toBe("0.0003891");
});

test("spreadRatio is the bid/ask gap over the mid, and null when a side is missing or crossed", () => {
  expect(spreadRatio({ bidXch: 0.9, askXch: 1.1 })).toBeCloseTo(0.2, 10);
  expect(spreadRatio({ bidXch: null, askXch: 1 })).toBeNull();
  expect(spreadRatio({ bidXch: 0, askXch: 1 })).toBeNull();
  expect(spreadRatio({ bidXch: 1.2, askXch: 1 })).toBeNull();
});
