import { describe, expect, test } from "bun:test";
import gateTrades from "@/test-utils/fixtures/marketGateTrades.json";
import htxTrades from "@/test-utils/fixtures/marketHtxTrades.json";
import okxTrades from "@/test-utils/fixtures/marketOkxTrades.json";
import {
  hitSide,
  mergeTape,
  parseGateTrades,
  parseHtxTrades,
  parseOkxTrades,
  takerShare,
  type MarketTrade,
} from "./trades";

describe("market trades (recorded 2026-09-23)", () => {
  test("parses Gate, OKX and HTX fills newest first", () => {
    const gate = parseGateTrades(gateTrades, "USDT");
    expect(gate).toHaveLength(20);
    expect(gate[0]).toEqual({
      exchange: "Gate",
      quote: "USDT",
      id: "9972408",
      priceScaled: 163_000_000n,
      amount: 20.475,
      side: "sell",
      at: 1_790_157_176_568,
    });
    const okx = parseOkxTrades(okxTrades, "USDT");
    expect(okx[0]).toMatchObject({ id: "41531462", priceScaled: 163_300_000n, side: "buy" });
    const htx = parseHtxTrades(htxTrades, "USDT");
    expect(htx[0]).toMatchObject({
      exchange: "HTX",
      id: "131666809",
      priceScaled: 164_640_000n,
      amount: 49.6168,
      side: "sell",
      at: 1_790_155_939_634,
    });
    for (const list of [gate, okx, htx])
      for (let i = 1; i < list.length; i++) expect(list[i]!.at <= list[i - 1]!.at).toBe(true);
  });

  test("a taker buy hits the asks, a taker sell the bids", () => {
    expect(hitSide({ side: "buy" })).toBe("asks");
    expect(hitSide({ side: "sell" })).toBe("bids");
  });

  test("drops malformed trades", () => {
    expect(
      parseGateTrades(
        [{ id: "1", price: "x", amount: "1", side: "buy", create_time_ms: "1" }, null, 3],
        "USDT"
      )
    ).toEqual([]);
    expect(parseOkxTrades({ code: "50011" }, "USDT")).toEqual([]);
  });

  test("merges polls into a capped tape and returns only new fills, oldest first", () => {
    const t = (id: string, at: number, side: "buy" | "sell" = "buy"): MarketTrade => ({
      exchange: "Gate",
      quote: "USDT",
      id,
      priceScaled: 1n,
      amount: 1,
      side,
      at,
    });
    const first = mergeTape([], [t("b", 2), t("a", 1)], 3);
    expect(first.fresh.map((x) => x.id)).toEqual(["a", "b"]);
    const second = mergeTape(first.tape, [t("d", 4), t("c", 3), t("b", 2)], 3);
    expect(second.fresh.map((x) => x.id)).toEqual(["c", "d"]);
    expect(second.tape.map((x) => x.id)).toEqual(["d", "c", "b"]);
    // "a" fell off the cap; seeing it again is not a new fill.
    expect(mergeTape(second.tape, [t("a", 1)], 3).fresh).toEqual([]);
  });

  test("taker share of the traded volume", () => {
    const gate = parseGateTrades(gateTrades, "USDT");
    const share = takerShare(gate);
    expect(share.buy + share.sell).toBeCloseTo(
      gate.reduce((s, x) => s + x.amount, 0),
      9
    );
    expect(takerShare(gate, Number.MAX_SAFE_INTEGER).buyShare).toBeNull();
    expect(takerShare([]).buyShare).toBeNull();
  });
});
