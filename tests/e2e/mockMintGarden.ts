import type { Page, Route } from "@playwright/test";
import { launcherIdToNftId } from "../../src/shared/lib/chia/address";

const json = (route: Route, body: unknown) => route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });

export const NFT_LAUNCHER_ID = "aa".repeat(32);
export const NFT_ID = launcherIdToNftId(NFT_LAUNCHER_ID);
export const COLLECTION_ID = "col1testcollection00000000000000000000000000000000000000000000000";

const COLLECTION = {
  id: COLLECTION_ID,
  name: "Test Friends",
  thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/collection.webp",
  creator: { name: "Test Studio" },
  volume: 42.5,
  floor_price: 1.25,
  nft_count: 100,
  trade_count: 7,
};

function event(nftId: string, type: number, blockHeight: number, xchPrice: number | null = null) {
  return {
    nft_id: `0x${nftId}`,
    type,
    timestamp: "2026-09-17T12:00:00+00:00",
    block_height: blockHeight,
    xch_price: xchPrice,
    address: { encoded_id: "xch1testaddress" },
    nft: { encoded_id: NFT_ID, data: { name: "Test Friend #1", thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/nft.webp" }, collection: COLLECTION },
  };
}

const EVENTS = [event(NFT_LAUNCHER_ID, 0, 9300001), event(NFT_LAUNCHER_ID, 2, 9300002, 3.5), event(NFT_LAUNCHER_ID, 1, 9300003)];

/** Only a query containing "friend" (case-insensitive) returns matches, so a test can also exercise the no-matches path. */
export async function mockMintGardenSearch(page: Page) {
  await page.route(/https:\/\/api\.mintgarden\.io\/search\?.*/, (route) => {
    const url = new URL(route.request().url());
    const query = (url.searchParams.get("query") ?? "").toLowerCase();
    const hit = query.includes("friend");
    return json(route, {
      xchandle_resolution: null,
      xchandles: [],
      nfts: hit ? [{ encoded_id: NFT_ID, name: "Test Friend #1", thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/nft.webp" }] : [],
      collections: hit ? [{ id: COLLECTION_ID, name: "Test Friends", thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/collection.webp" }] : [],
      profiles: [],
      addresses: [],
    });
  });
}

export async function mockMintGarden(page: Page) {
  await page.route(/https:\/\/api\.mintgarden\.io\/collections(\?.*)?$/, (route) => json(route, { items: [COLLECTION], next: null }));
  await page.route(/https:\/\/api\.mintgarden\.io\/events.*/, (route) => {
    const url = new URL(route.request().url());
    const types = url.searchParams.getAll("type").map(Number);
    const items = types.length > 0 ? EVENTS.filter((e) => types.includes(e.type)) : EVENTS;
    return json(route, { items, next: null });
  });
  await page.route(/https:\/\/api\.mintgarden\.io\/nfts\/.*/, (route) =>
    json(route, {
      id: NFT_LAUNCHER_ID,
      encoded_id: NFT_ID,
      data: { name: "Test Friend #1", description: "A test NFT", thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/nft.webp", metadata_json: { name: "Test Friend #1", collection: { id: COLLECTION_ID, name: "Test Friends" } } },
      royalty_percentage: 300,
      owner_address: { id: "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4" },
      creator_address: { id: "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4" },
    })
  );
}

export async function mockDexieOffers(page: Page) {
  await page.route(/https:\/\/api\.dexie\.space\/v1\/offers.*/, (route) =>
    json(route, {
      success: true,
      count: 1,
      offers: [{ id: "TestOffer1", offer: "offer1testfile", price: 1.25, requested: [{ code: "XCH", amount: 1.25 }], date_found: "2026-09-17T10:00:00Z", date_expiry: null }],
    })
  );
}
