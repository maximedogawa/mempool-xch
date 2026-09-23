import type { Page } from "@playwright/test";
import { mockCoinset, mockDexie, mockSummary, TOKEN_ACTIVE } from "./mockCoinset";
import { mockMintGarden, NFT_LAUNCHER_ID } from "./mockMintGarden";

/**
 * A deterministic mempool for the next-block goggles: the last visit's snapshot seeds five
 * compact bundles (plus `filler` ordinary ones for a full block) and the mocked id list keeps
 * exactly those pending, so the sync fetches nothing. Works for the standalone build and the
 * Sage export alike: both read Coinset from the browser.
 */
export const SNAPSHOT_KEY = "mempool-xch:mempool-snapshot:v1:mainnet";

export const GOGGLES_ID = {
  xch: "a1".repeat(32),
  cat: "b2".repeat(32),
  nft: "c3".repeat(32),
  offer: "d4".repeat(32),
  dust: "e5".repeat(32),
};

function bundle(
  id: string,
  kind: string,
  cost: number,
  feeRate: number,
  assets: Record<string, unknown>,
  ageMs: number,
  assetIds: string[] = []
) {
  return {
    id,
    fee: String(Math.round(cost * feeRate)),
    cost,
    feeRate,
    spends: 2,
    additions: [],
    removals: [],
    additionCount: 2,
    removalCount: 2,
    assets: { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0, ...assets },
    firstSeen: Date.now() - ageMs,
    kind,
    assetIds,
  };
}

export async function mockGogglesMempool(page: Page, filler = 0) {
  await mockCoinset(page);
  await mockDexie(page);
  await mockMintGarden(page);
  await page.route(/https:\/\/(assets\.mainnet|ipfs)\.mintgarden\.io\/.*/, (route) =>
    route.fulfill({ status: 404, body: "" })
  );
  const base = mockSummary();
  const items = [
    bundle(GOGGLES_ID.xch, "xch", 20_000_000, 0, { xch: "1500000000000" }, 5 * 60_000),
    bundle(
      GOGGLES_ID.cat,
      "cat",
      60_000_000,
      6,
      { cats: [{ assetId: TOKEN_ACTIVE, amount: "12345" }] },
      20 * 60_000,
      [TOKEN_ACTIVE]
    ),
    bundle(GOGGLES_ID.nft, "nft", 400_000_000, 1.5, { nfts: 1, xch: "1" }, 2 * 3_600_000, [
      NFT_LAUNCHER_ID,
    ]),
    bundle(
      GOGGLES_ID.offer,
      "offer",
      30_000_000,
      30,
      { xch: "5", cats: [{ assetId: TOKEN_ACTIVE, amount: "1000" }] },
      30_000
    ),
    bundle(GOGGLES_ID.dust, "xch", 8_000_000, 2, { xch: "250000" }, 40_000),
  ];
  // A full block: ordinary bundles on top of the five above.
  for (let i = 0; i < filler; i += 1)
    items.push(
      bundle(
        (0x10000 + i).toString(16).padStart(64, "f"),
        i % 3 === 0 ? "cat" : "xch",
        6_000_000 + ((i * 7919) % 8_000_000),
        (i % 7) * 0.5,
        { xch: String(1_000_000_000 * (i + 1)) },
        (i % 50) * 60_000
      )
    );
  const snapshot = { ...base, generatedAt: Date.now(), source: "browser", items };
  await page.addInitScript(({ key, value }) => window.localStorage.setItem(key, value), {
    key: SNAPSHOT_KEY,
    value: JSON.stringify(snapshot),
  });
  // Registered last, so it answers first: the pending ids are exactly the seeded bundles.
  await page.route(/https:\/\/api\.coinset\.org\/get_all_mempool_tx_ids$/, (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ tx_ids: items.map((i) => `0x${i.id}`), success: true }),
    })
  );
}

/** The goggles card on the dashboard. */
export function goggles(page: Page) {
  return page
    .getByRole("heading", { name: /^Next block/ })
    .locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
}
