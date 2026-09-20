import type { Page, Route } from "@playwright/test";
import { launcherIdToNftId } from "../../src/shared/lib/chia/address";

const json = (route: Route, body: unknown) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });

export const NFT_LAUNCHER_ID = "aa".repeat(32);
export const NFT_ID = launcherIdToNftId(NFT_LAUNCHER_ID);
export const COLLECTION_ID = "col1testcollection00000000000000000000000000000000000000000000000";
/** A second NFT whose collection MintGarden marks as blocked, mirroring the live Kamasutra case:
 * the NFT's own flags are clean and only the collection carries the verdict. */
export const BLOCKED_LAUNCHER_ID = "bb".repeat(32);
export const BLOCKED_NFT_ID = launcherIdToNftId(BLOCKED_LAUNCHER_ID);
export const BLOCKED_COLLECTION_ID =
  "col1blockedcollection0000000000000000000000000000000000000000000";
export const BLOCKED_REASON = "Pornographic Material";
/** A third NFT whose artwork is a video and whose creator MintGarden has stopped from minting. */
export const VIDEO_LAUNCHER_ID = "cc".repeat(32);
export const VIDEO_NFT_ID = launcherIdToNftId(VIDEO_LAUNCHER_ID);
export const VIDEO_URL = "https://ipfs.mintgarden.io/ipfs/bafytestvideo/454.mp4";
export const CREATOR_BLOCKED_REASON = "Terms of service violation: Pornographic content";

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

const BLOCKED_COLLECTION = {
  id: BLOCKED_COLLECTION_ID,
  name: "Blocked Friends",
  thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/blocked-collection.webp",
  creator: { name: "Test Studio" },
  volume: 7.7,
  floor_price: 1,
  nft_count: 250,
  trade_count: 7,
  sensitive_content: false,
  blocked_content: true,
  blocked_content_reason: BLOCKED_REASON,
};

function event(nftId: string, type: number, blockHeight: number, xchPrice: number | null = null) {
  return {
    nft_id: `0x${nftId}`,
    type,
    timestamp: "2026-09-17T12:00:00+00:00",
    block_height: blockHeight,
    xch_price: xchPrice,
    address: { encoded_id: "xch1testaddress" },
    // MintGarden carries an event's collection at the top level, beside `nft`.
    collection: COLLECTION,
    nft: {
      encoded_id: NFT_ID,
      data: {
        name: "Test Friend #1",
        thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/nft.webp",
      },
    },
  };
}

function blockedEvent(blockHeight: number) {
  return {
    nft_id: `0x${BLOCKED_LAUNCHER_ID}`,
    type: 1,
    timestamp: "2026-09-17T12:00:00+00:00",
    block_height: blockHeight,
    xch_price: null,
    address: { encoded_id: "xch1testaddress" },
    collection: {
      id: BLOCKED_COLLECTION_ID,
      name: "Blocked Friends",
      sensitive_content: false,
      blocked_content: true,
    },
    nft: {
      encoded_id: BLOCKED_NFT_ID,
      is_blocked: false,
      data: {
        name: "Blocked Friend #1",
        sensitive_content: false,
        thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/blocked-nft.webp",
      },
    },
  };
}

const EVENTS = [
  event(NFT_LAUNCHER_ID, 0, 9300001),
  event(NFT_LAUNCHER_ID, 2, 9300002, 3.5),
  event(NFT_LAUNCHER_ID, 1, 9300003),
  blockedEvent(9300004),
];

/** Only a query containing "friend" (case-insensitive) returns matches, so a test can also exercise the no-matches path. */
export async function mockMintGardenSearch(page: Page) {
  await page.route(/https:\/\/api\.mintgarden\.io\/search\?.*/, (route) => {
    const url = new URL(route.request().url());
    const query = (url.searchParams.get("query") ?? "").toLowerCase();
    const hit = query.includes("friend");
    return json(route, {
      xchandle_resolution: null,
      xchandles: [],
      nfts: hit
        ? [
            {
              encoded_id: NFT_ID,
              name: "Test Friend #1",
              thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/nft.webp",
            },
          ]
        : [],
      collections: hit
        ? [
            {
              id: COLLECTION_ID,
              name: "Test Friends",
              thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/collection.webp",
            },
            {
              id: BLOCKED_COLLECTION_ID,
              name: "Blocked Friends",
              thumbnail_uri:
                "https://assets.mainnet.mintgarden.io/thumbnails/blocked-collection.webp",
              blocked_content: true,
              blocked_content_reason: BLOCKED_REASON,
            },
          ]
        : [],
      profiles: [],
      addresses: [],
    });
  });
}

export async function mockMintGarden(page: Page) {
  await page.route(/https:\/\/api\.mintgarden\.io\/collections(\?.*)?$/, (route) =>
    json(route, { items: [COLLECTION, BLOCKED_COLLECTION], next: null })
  );
  await page.route(/https:\/\/api\.mintgarden\.io\/events.*/, (route) => {
    const url = new URL(route.request().url());
    const types = url.searchParams.getAll("type").map(Number);
    const items = types.length > 0 ? EVENTS.filter((e) => types.includes(e.type)) : EVENTS;
    return json(route, { items, next: null });
  });
  await page.route(/https:\/\/api\.mintgarden\.io\/nfts\/.*/, (route) => {
    if (route.request().url().includes(VIDEO_NFT_ID)) {
      // Video artwork, clean collection, blocked creator: the creator alone decides here.
      return json(route, {
        id: VIDEO_LAUNCHER_ID,
        encoded_id: VIDEO_NFT_ID,
        is_blocked: false,
        data: {
          name: "Video Friend #1",
          thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/video-nft.webp",
          data_uris: [VIDEO_URL],
          data_type: 3,
          metadata_json: { name: "Video Friend #1", sensitive_content: false },
        },
        collection: { id: COLLECTION_ID, name: "Test Friends", sensitive_content: true },
        creator: {
          name: "Blocked Studio",
          minting_blocked: true,
          minting_blocked_reason: CREATOR_BLOCKED_REASON,
        },
        royalty_percentage: 300,
        owner_address: { id: "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4" },
      });
    }
    if (route.request().url().includes(BLOCKED_NFT_ID)) {
      // Clean own flags, blocked collection: the verdict has to come from the collection.
      return json(route, {
        id: BLOCKED_LAUNCHER_ID,
        encoded_id: BLOCKED_NFT_ID,
        is_blocked: false,
        data: {
          name: "Blocked Friend #1",
          description: "A blocked test NFT",
          thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/blocked-nft.webp",
          metadata_json: {
            name: "Blocked Friend #1",
            sensitive_content: false,
            collection: { id: BLOCKED_COLLECTION_ID, name: "Blocked Friends" },
          },
        },
        collection: BLOCKED_COLLECTION,
        royalty_percentage: 300,
        owner_address: { id: "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4" },
      });
    }
    return json(route, {
      id: NFT_LAUNCHER_ID,
      encoded_id: NFT_ID,
      data: {
        name: "Test Friend #1",
        description: "A test NFT",
        thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/nft.webp",
        metadata_json: {
          name: "Test Friend #1",
          collection: { id: COLLECTION_ID, name: "Test Friends" },
        },
      },
      royalty_percentage: 300,
      owner_address: { id: "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4" },
      creator_address: { id: "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4" },
    });
  });
}

export async function mockDexieOffers(page: Page) {
  await page.route(/https:\/\/api\.dexie\.space\/v1\/offers.*/, (route) =>
    json(route, {
      success: true,
      count: 1,
      offers: [
        {
          id: "TestOffer1",
          offer: "offer1testfile",
          price: 1.25,
          requested: [{ code: "XCH", amount: 1.25 }],
          date_found: "2026-09-17T10:00:00Z",
          date_expiry: null,
        },
      ],
    })
  );
}
