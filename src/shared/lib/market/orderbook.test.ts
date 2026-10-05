import { describe, expect, test } from "bun:test";
import gateBook from "@/test-utils/fixtures/marketGateBook.json";
import gateUsdc from "@/test-utils/fixtures/marketGateBookUsdcInvalid.json";
import htxBook from "@/test-utils/fixtures/marketHtxBook.json";
import htxUsdc from "@/test-utils/fixtures/marketHtxBookUsdcInvalid.json";
import okxBook from "@/test-utils/fixtures/marketOkxBook.json";
import okxUsdc from "@/test-utils/fixtures/marketOkxBookUsdc.json";
import {
  apiError,
  compare,
  crossExchange,
  lists,
  midPrice,
  parseGateBook,
  parseHtxBook,
  parseOkxBook,
  spread,
} from "./orderbook";

const at = 1_790_157_200_000;

describe("market order books (recorded 2026-09-23)", () => {
  const gate = parseGateBook(gateBook, "USDT", at);
  const okx = parseOkxBook(okxBook, "USDT", at);
  const htx = parseHtxBook(htxBook, "USDT", at);

  test("parses every exchange's shape, best first", () => {
    expect(gate.bids).toHaveLength(20);
    expect(gate.bids[0]).toEqual({ priceScaled: 163_000_000n, amount: 20.462 });
    expect(gate.asks[0]).toEqual({ priceScaled: 163_100_000n, amount: 37.863 });
    expect(okx.bids[0]?.priceScaled).toBe(163_100_000n);
    expect(okx.asks[0]?.priceScaled).toBe(163_500_000n);
    // HTX sends JSON numbers; they parse to the same exact fixed point.
    expect(htx.bids[0]).toEqual({ priceScaled: 163_620_000n, amount: 1.3333 });
    expect(htx.asks[0]?.priceScaled).toBe(164_790_000n);
    for (const b of [gate, okx, htx]) {
      for (let i = 1; i < b.bids.length; i++)
        expect(b.bids[i]!.priceScaled < b.bids[i - 1]!.priceScaled).toBe(true);
      for (let i = 1; i < b.asks.length; i++)
        expect(b.asks[i]!.priceScaled > b.asks[i - 1]!.priceScaled).toBe(true);
    }
  });

  test("spread per exchange in absolute and percent", () => {
    expect(spread(gate)).toEqual({ absolute: 100_000n, ppm: 613n });
    expect(spread(okx)).toEqual({ absolute: 400_000n, ppm: 2_449n });
    expect(spread(htx)?.absolute).toBe(1_170_000n);
  });

  test("best cross-exchange bid and ask name their exchange, even when crossed", () => {
    const cross = crossExchange([gate, okx, htx]);
    expect(cross.bid).toMatchObject({ exchange: "HTX", priceScaled: 163_620_000n });
    expect(cross.ask).toMatchObject({ exchange: "Gate", priceScaled: 163_100_000n });
    expect(midPrice(cross.bid!.priceScaled, cross.ask!.priceScaled)).toBe(163_360_000n);
    expect(crossExchange([gate, okx]).bid?.exchange).toBe("OKX");
  });

  test("USDC is listed only on OKX; the others answer with an error payload", () => {
    expect(parseOkxBook(okxUsdc, "USDC", at).bids[0]?.priceScaled).toBe(162_400_000n);
    expect(lists("OKX", "USDC")).toBe(true);
    expect(lists("Gate", "USDC")).toBe(false);
    expect(lists("HTX", "USDC")).toBe(false);
    expect(apiError(gateUsdc)).toBe("Invalid currency pair XCH_USDC");
    expect(apiError(htxUsdc)).toBe("invalid symbol");
    expect(apiError(okxBook)).toBeNull();
    expect(apiError({ code: "50011", msg: "Too Many Requests" })).toBe("Too Many Requests");
    expect(apiError(gateBook)).toBeNull();
  });

  test("ignores malformed and non-positive levels", () => {
    const book = parseGateBook(
      {
        bids: [
          ["bad", 1],
          [0, 2],
          ["1.2", "3"],
          ["1.1", "-1"],
        ],
        asks: null,
      },
      "USDT",
      1
    );
    expect(book.bids).toEqual([{ priceScaled: 120_000_000n, amount: 3 }]);
    expect(book.asks).toEqual([]);
  });

  test("compares two prices signed, relative to the second", () => {
    expect(compare(182_926_829n, 163_360_000n)).toEqual({
      absolute: 19_566_829n,
      ppm: 119_777n,
    });
    expect(compare(null, 1n)).toBeNull();
  });
});
