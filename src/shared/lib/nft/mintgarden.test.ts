import { describe, expect, test } from "bun:test";
import {
  fetchCollections,
  fetchDidHeldCollections,
  fetchDidProfile,
  fetchNftEvents,
  fetchNftOffers,
  mintGardenThumbnailUrl,
  searchMintGarden,
  type MinimalResponse,
} from "./mintgarden";

function okResponse(body: unknown): Promise<MinimalResponse> {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}

describe("fetchCollections", () => {
  test("normalises volume, floor price and counts, and carries the pagination cursor", async () => {
    const result = await fetchCollections({}, () =>
      okResponse({
        items: [
          {
            id: "col1abc",
            name: "Chia Friends",
            thumbnail_uri: "https://x/y.png",
            creator: { name: "Chia Network" },
            volume: 986.6,
            floor_price: 13.5,
            nft_count: 9997,
            trade_count: 34,
          },
        ],
        next: ">f:1~s:col1abc",
      })
    );
    expect(result.collections).toEqual([
      {
        id: "col1abc",
        name: "Chia Friends",
        thumbnailUrl: "https://x/y.png",
        creatorName: "Chia Network",
        volumeXch: 986.6,
        floorPriceXch: 13.5,
        nftCount: 9997,
        tradeCount: 34,
        sensitivity: { level: "clear", reason: null },
      },
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
          {
            nft_id: "0xAA",
            type: 0,
            timestamp: "2026-01-01T00:00:00+00:00",
            block_height: 100,
            nft: { data: { name: "Mint #1" } },
          },
          {
            nft_id: "0xBB",
            type: 2,
            timestamp: "2026-01-02T00:00:00+00:00",
            block_height: 101,
            xch_price: 5,
            nft: { data: { name: "Trade #1" } },
          },
          {
            nft_id: "0xCC",
            type: 1,
            // MintGarden puts the collection at the top level of an event, not inside `nft`.
            collection: {
              id: "col1porn",
              name: "Kamasutra: R.E. Edition",
              blocked_content: true,
              sensitive_content: false,
            },
            nft: { data: { name: "Veiled #1" }, is_blocked: false },
          },
          { type: 1 },
        ],
        next: null,
      })
    );
    expect(result.events).toHaveLength(3);
    expect(result.events[0]).toMatchObject({ nftId: "aa", kind: "mint", nftName: "Mint #1" });
    expect(result.events[1]).toMatchObject({ nftId: "bb", kind: "trade", xchPrice: 5 });
    expect(result.events[0]!.sensitivity).toEqual({ level: "clear", reason: null });
    // The collection's block flag reaches the row, and so does its name.
    expect(result.events[2]).toMatchObject({
      nftId: "cc",
      collectionId: "col1porn",
      collectionName: "Kamasutra: R.E. Edition",
      sensitivity: { level: "blocked", reason: null },
    });
  });
});

describe("fetchNftOffers", () => {
  test("sorts by price ascending even when the source order is not sorted", async () => {
    const result = await fetchNftOffers("nft1x", () =>
      okResponse({
        offers: [
          {
            id: "b",
            offer: "offer1b",
            price: 10,
            requested: [{ code: "XCH", amount: 10 }],
            date_found: "2026-01-01T00:00:00Z",
          },
          {
            id: "a",
            offer: "offer1a",
            price: 2,
            requested: [{ code: "XCH", amount: 2 }],
            date_found: "2026-01-01T00:00:00Z",
          },
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

describe("searchMintGarden", () => {
  test("maps nft and collection matches, dropping entries with no id", async () => {
    const result = await searchMintGarden("Chia Friends", () =>
      okResponse({
        nfts: [
          {
            encoded_id: "nft1blocked",
            name: "HOTSHOT #540",
            thumbnail_uri: "https://assets.mainnet.mintgarden.io/blocked.webp",
            // /search flattens the collection's verdict onto the row; the nested shape a
            // /nfts/{id} read expects is simply not there, and reading it would call this clear.
            is_blocked: false,
            sensitive_content: false,
            collection_blocked_content: true,
            collection_blocked_content_reason: "Pornographic material",
          },
          {
            encoded_id: "nft1abc",
            name: "Friend #1",
            thumbnail_uri: "https://assets.mainnet.mintgarden.io/x.webp",
          },
          { encoded_id: null, name: "No id" },
        ],
        collections: [
          {
            id: "col1abc",
            name: "Chia Friends",
            thumbnail_uri: "https://assets.mainnet.mintgarden.io/y.webp",
          },
          {
            id: "col1blocked",
            name: "Blocked Friends",
            thumbnail_uri: "https://assets.mainnet.mintgarden.io/z.webp",
            blocked_content: true,
            blocked_content_reason: "Pornographic material",
          },
        ],
        profiles: [{ id: "should be ignored" }],
      })
    );
    expect(result.nfts[0]).toEqual({
      nftId: "nft1blocked",
      name: "HOTSHOT #540",
      thumbnailUrl: "https://assets.mainnet.mintgarden.io/blocked.webp",
      sensitivity: { level: "blocked", reason: "Pornographic material" },
    });
    expect(result.nfts.slice(1)).toEqual([
      {
        nftId: "nft1abc",
        name: "Friend #1",
        thumbnailUrl: "https://assets.mainnet.mintgarden.io/x.webp",
        sensitivity: { level: "clear", reason: null },
      },
    ]);
    // A collection hit carries no flags at all, so it is never shown on trust.
    expect(result.collections.map((c) => c.sensitivity)).toEqual([
      { level: "sensitive", reason: null },
      { level: "sensitive", reason: null },
    ]);
  });

  test("empty query short-circuits without fetching", async () => {
    let called = false;
    const result = await searchMintGarden("   ", () => {
      called = true;
      return okResponse({});
    });
    expect(called).toBe(false);
    expect(result).toEqual({ nfts: [], collections: [] });
  });

  test("a failed or rate-limited fetch degrades to no results, not an error", async () => {
    const result = await searchMintGarden("test", () => Promise.reject(new Error("network")));
    expect(result).toEqual({ nfts: [], collections: [] });
  });
});

describe("mintGardenThumbnailUrl", () => {
  test("builds the direct thumbnail redirect URL", () => {
    expect(mintGardenThumbnailUrl("nft1abc")).toBe(
      "https://api.mintgarden.io/nfts/nft1abc/thumbnail"
    );
  });
});

describe("fetchDidProfile", () => {
  test("normalises the profile of a DID, counts included", async () => {
    const urls: string[] = [];
    const profile = await fetchDidProfile(
      "0x73EF2C17B2ED1E979CB449FF28852C337018CD1F7E5E4B6ABF1448E8D650A6D9",
      { counts: true },
      (url) => {
        urls.push(url);
        return okResponse({
          id: "73ef2c17b2ed1e979cb449ff28852c337018cd1f7e5e4b6abf1448e8d650a6d9",
          encoded_id: "did:chia:1w0hjc9aja50f0895f8lj3pfvxdcp3ngl0e0yk64lz3yw34js5mvstx2cnk",
          name: "MaximEdogawa.xch",
          bio: "NFT collector",
          website: "",
          twitter_handle: "MaximEdogawa",
          avatar_uri: "https://assets.mainnet.mintgarden.io/profiles/x.webp",
          owned_nfts_count: 81,
          created_nfts_count: 0,
          // A record with counts reports the state as a string; without them it is a number.
          verification_state: "0",
        });
      }
    );
    expect(urls[0]).toBe(
      "https://api.mintgarden.io/profile/73ef2c17b2ed1e979cb449ff28852c337018cd1f7e5e4b6abf1448e8d650a6d9?include_counts=true"
    );
    expect(profile).toEqual({
      launcherId: "73ef2c17b2ed1e979cb449ff28852c337018cd1f7e5e4b6abf1448e8d650a6d9",
      didId: "did:chia:1w0hjc9aja50f0895f8lj3pfvxdcp3ngl0e0yk64lz3yw34js5mvstx2cnk",
      name: "MaximEdogawa.xch",
      bio: "NFT collector",
      website: null,
      twitterHandle: "MaximEdogawa",
      avatarUrl: "https://assets.mainnet.mintgarden.io/profiles/x.webp",
      ownedNfts: 81,
      createdNfts: 0,
      verified: false,
    });
  });

  test("falls back to the username and reads a verified profile", async () => {
    const profile = await fetchDidProfile("aa".repeat(32), {}, () =>
      okResponse({ id: "aa".repeat(32), username: "dracattus", verification_state: 1 })
    );
    expect(profile?.name).toBe("dracattus");
    expect(profile?.verified).toBe(true);
    expect(profile?.ownedNfts).toBeNull();
  });

  test("a record without an id, a failed fetch and an empty id all give null", async () => {
    expect(await fetchDidProfile("bb".repeat(32), {}, () => okResponse({}))).toBeNull();
    expect(
      await fetchDidProfile("bb".repeat(32), {}, () => Promise.reject(new Error("network")))
    ).toBeNull();
    expect(await fetchDidProfile("", {}, () => okResponse({ id: "x" }))).toBeNull();
  });
});

describe("fetchDidHeldCollections", () => {
  test("sorts collections by the number held and drops entries with no id", async () => {
    const held = await fetchDidHeldCollections("cc".repeat(32), () =>
      okResponse([
        { id: "col1a", name: "Dracattus", thumbnail_uri: "https://x/a.webp", nfts_owned: 10 },
        { name: "No id", nfts_owned: 99 },
        { id: "col1b", name: "Pickles", thumbnail_uri: null, nfts_owned: 11 },
      ])
    );
    expect(held).toEqual([
      { id: "col1b", name: "Pickles", thumbnailUrl: null, nftsOwned: 11 },
      { id: "col1a", name: "Dracattus", thumbnailUrl: "https://x/a.webp", nftsOwned: 10 },
    ]);
  });

  test("a non-array body degrades to no collections", async () => {
    expect(await fetchDidHeldCollections("dd".repeat(32), () => okResponse({}))).toEqual([]);
  });
});
