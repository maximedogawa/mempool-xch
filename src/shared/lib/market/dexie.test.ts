import { describe, expect, test } from "bun:test";
import asksByc from "@/test-utils/fixtures/marketDexieAsksByc.json";
import asksWusdcb from "@/test-utils/fixtures/marketDexieAsksWusdcb.json";
import bidsByc from "@/test-utils/fixtures/marketDexieBidsByc.json";
import bidsWusdcb from "@/test-utils/fixtures/marketDexieBidsWusdcb.json";
import { DEX_QUOTE_ASSETS, dexieOffersUrl, parseDexieOffers } from "./dexie";

const BYC = DEX_QUOTE_ASSETS.BYC.assetId;

describe("Dexie offers as a DEX book (recorded 2026-09-23)", () => {
  test("prices come from the offer amounts, not Dexie's float price", () => {
    // Dexie reports this offer's price as 1.8099999999999998; 0.181 BYC / 0.1 XCH is 1.81.
    const asks = parseDexieOffers(asksByc, "BYC", "asks");
    expect(asks[0]).toEqual({ priceScaled: 181_000_000n, amount: 0.1 });
    const bids = parseDexieOffers(bidsByc, "BYC", "bids");
    expect(bids[0]).toEqual({ priceScaled: 173_000_000n, amount: 0.1 });
  });

  test("bids are quote per XCH, not Dexie's XCH per quote", () => {
    // Dexie price 0.5466…: 0.225 wUSDC.b offered for 0.123 XCH, a bid of 1.829… wUSDC.b per XCH.
    const bids = parseDexieOffers(bidsWusdcb, "wUSDC.b", "bids");
    expect(bids[0]?.priceScaled).toBe(182_926_829n);
    for (let i = 1; i < bids.length; i++)
      expect(bids[i]!.priceScaled <= bids[i - 1]!.priceScaled).toBe(true);
    const asks = parseDexieOffers(asksWusdcb, "wUSDC.b", "asks");
    expect(asks[0]).toEqual({ priceScaled: 300_000_000n, amount: 50 });
    for (let i = 1; i < asks.length; i++)
      expect(asks[i]!.priceScaled >= asks[i - 1]!.priceScaled).toBe(true);
  });

  test("skips offers for another asset or bundled with more legs", () => {
    expect(parseDexieOffers(asksByc, "wUSDC.b", "asks")).toEqual([]);
    const bundle = {
      offers: [
        {
          offered: [
            { id: "xch", amount: 1 },
            { id: "xch", amount: 2 },
          ],
          requested: [{ id: BYC, amount: 3 }],
        },
      ],
    };
    expect(parseDexieOffers(bundle, "BYC", "asks")).toEqual([]);
    expect(parseDexieOffers({ success: false }, "BYC", "asks")).toEqual([]);
  });

  test("builds the offers query per side", () => {
    expect(dexieOffersUrl("BYC", "asks")).toContain(`offered=xch&requested=${BYC}&sort=price`);
    expect(dexieOffersUrl("BYC", "bids")).toContain(`offered=${BYC}&requested=xch&sort=price`);
  });
});
