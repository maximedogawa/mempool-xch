import { describe, expect, test } from "bun:test";
import { fetchCollections, fetchNftEvents, fetchNftOffers, type MinimalResponse } from "./mintgarden";

function okResponse(body: unknown): Promise<MinimalResponse> {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}

describe("fetchCollections", () => {
  test("normalises volume, floor price and counts, and carries the pagination cursor", async () => {
    const result = await fetchCollections({}, () =>
      okResponse({
        items: [{ id: "col1abc", name: "Chia Friends", thumbnail_uri: "https://x/y.png", creator: { name: "Chia Network" }, volume: 986.6, floor_price: 13.5, nft_count: 9997, trade_count: 34 }],
        next: ">f:1~s:col1abc",
      })
    );
    expect(result.collections).toEqual([
      { id: "col1abc", name: "Chia Friends", thumbnailUrl: "https://x/y.png", creatorName: "Chia Network", volumeXch: 986.6, floorPriceXch: 13.5, nftCount: 9997, tradeCount: 34 },
    ]);
    expect(result.next).toBe(">f:1~s:col1abc");
  });

  test("a failed fetch degrades to an empty page instead of throwing", async () => {
    const result = await fetchCollections({}, () => Promise.reject(new Error("network")));
    expect(result).toEqual({ collections: [], next: null });
  });
});

describe("fetchNftEvents", () => {
  test("maps numeric event types to kinds and skips events with no nft id", async () => {
    const result = await fetchNftEvents({}, () =>
      okResponse({
        items: [
          { nft_id: "0xAA", type: 0, timestamp: "2026-01-01T00:00:00+00:00", block_height: 100, nft: { data: { name: "Mint #1" } } },
          { nft_id: "0xBB", type: 2, timestamp: "2026-01-02T00:00:00+00:00", block_height: 101, xch_price: 5, nft: { data: { name: "Trade #1" } } },
          { type: 1 },
        ],
        next: null,
      })
    );
    expect(result.events).toHaveLength(2);
    expect(result.events[0]).toMatchObject({ nftId: "aa", kind: "mint", nftName: "Mint #1" });
    expect(result.events[1]).toMatchObject({ nftId: "bb", kind: "trade", xchPrice: 5 });
  });
});

describe("fetchNftOffers", () => {
  test("sorts by price ascending even when the source order is not sorted", async () => {
    const result = await fetchNftOffers("nft1x", () =>
      okResponse({
        offers: [
          { id: "b", offer: "offer1b", price: 10, requested: [{ code: "XCH", amount: 10 }], date_found: "2026-01-01T00:00:00Z" },
          { id: "a", offer: "offer1a", price: 2, requested: [{ code: "XCH", amount: 2 }], date_found: "2026-01-01T00:00:00Z" },
        ],
      })
    );
    expect(result.map((o) => o.id)).toEqual(["a", "b"]);
    expect(result[0]!.priceXch).toBe(2);
  });

  test("a failed fetch degrades to an empty list", async () => {
    const result = await fetchNftOffers("nft1x", () => Promise.reject(new Error("network")));
    expect(result).toEqual([]);
  });
});
