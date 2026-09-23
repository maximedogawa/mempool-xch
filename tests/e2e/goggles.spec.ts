import { expect, test, type Page } from "@playwright/test";
import { mockCoinset, mockDexie, mockSummary, TOKEN_ACTIVE } from "./mockCoinset";
import { mockMintGarden, NFT_LAUNCHER_ID } from "./mockMintGarden";

/**
 * The next-block goggles with a mocked mempool: the last visit's snapshot seeds five compact
 * bundles and the mocked id list keeps exactly those pending, so the sync fetches nothing and
 * the block is deterministic. Runs against the standalone build (playwright.config.ts) and the
 * Sage static export (playwright.sage.config.ts).
 */
const SNAPSHOT_KEY = "mempool-xch:mempool-snapshot:v1:mainnet";
const PREFS_KEY = "mempool-xch:goggles:v1";

const ID = {
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

async function mockMempool(page: Page) {
  await mockCoinset(page);
  await mockDexie(page);
  await mockMintGarden(page);
  await page.route(/https:\/\/(assets\.mainnet|ipfs)\.mintgarden\.io\/.*/, (route) =>
    route.fulfill({ status: 404, body: "" })
  );
  const base = mockSummary();
  const items = [
    bundle(ID.xch, "xch", 20_000_000, 0, { xch: "1500000000000" }, 5 * 60_000),
    bundle(
      ID.cat,
      "cat",
      60_000_000,
      6,
      { cats: [{ assetId: TOKEN_ACTIVE, amount: "12345" }] },
      20 * 60_000,
      [TOKEN_ACTIVE]
    ),
    bundle(ID.nft, "nft", 400_000_000, 1.5, { nfts: 1, xch: "1" }, 2 * 3_600_000, [
      NFT_LAUNCHER_ID,
    ]),
    bundle(
      ID.offer,
      "offer",
      30_000_000,
      30,
      { xch: "5", cats: [{ assetId: TOKEN_ACTIVE, amount: "1000" }] },
      30_000
    ),
    bundle(ID.dust, "xch", 8_000_000, 2, { xch: "250000" }, 40_000),
  ];
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

function goggles(page: Page) {
  return page
    .getByRole("heading", { name: /^Next block/ })
    .locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
}

const tile = (page: Page, pattern: RegExp) =>
  goggles(page).getByRole("link", { name: pattern }).first();

async function open(page: Page) {
  await page.goto("/");
  const section = goggles(page);
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByText(/5 bundles/)).toBeVisible({ timeout: 20_000 });
  return section;
}

test.describe("next-block goggles", () => {
  test.beforeEach(async ({ page }) => {
    await mockMempool(page);
  });

  test("tiles carry no text; a tile's tooltip is anchored, in the viewport and human-readable", async ({
    page,
    isMobile,
  }) => {
    const section = await open(page);
    const texts = await section
      .locator("[data-tile]")
      .evaluateAll((els) => els.map((el) => (el.textContent ?? "").trim()));
    expect(texts.length).toBe(5);
    // At most an icon glyph: never an amount, a unit or an id.
    texts.forEach((text) => expect(text).not.toMatch(/\d|XCH|mojo/));
    await expect(section.getByTestId("goggles-legend")).toContainText("size = cost");

    const cat = tile(page, /CAT, 12\.345 MAT, cost 60\.0M, 6\.00 mojo per cost/);
    if (isMobile) await cat.tap();
    else await cat.hover();
    const tip = page.getByTestId("goggles-tooltip");
    await expect(tip).toBeVisible();
    await expect(tip).toContainText("12.345 MAT");
    await expect(tip).toContainText("6.00 mojo/cost");
    await expect(tip).toContainText("Coin spends");
    await expect(tip).toContainText("In mempool");
    await expect(tip).toContainText(/60\.0M · \d+(\.\d)?% of the block/);
    const link = tip.getByRole("link", { name: "Open transaction" });
    await expect(link).toHaveAttribute("href", new RegExp(ID.cat));
    // Stays inside the viewport and next to its tile.
    const box = (await tip.boundingBox())!;
    const cell = (await cat.boundingBox())!;
    const viewport = page.viewportSize()!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
    const gap = Math.min(
      Math.abs(box.y + box.height - cell.y),
      Math.abs(box.y - (cell.y + cell.height))
    );
    expect(gap).toBeLessThan(40);

    // Dust is shown in XCH, never as a raw mojo count.
    if (isMobile) await tile(page, /0\.00000025 XCH/).tap();
    else await tile(page, /0\.00000025 XCH/).hover();
    await expect(tip).toContainText("0.00000025 XCH");
    await expect(tip).not.toContainText(/\d mojo(?!\/)/);

    // No horizontal scrolling at any width.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("the block summary opens the block card", async ({ page, isMobile }) => {
    const section = await open(page);
    const summary = section.getByRole("button", { name: /Block details/ });
    if (isMobile) await summary.tap();
    else await summary.hover();
    const card = page.getByTestId("goggles-block-card");
    await expect(card).toBeVisible();
    await expect(card).toContainText("Projected next block");
    await expect(card).toContainText("Total fees");
    await expect(card).toContainText(/median/);
    await expect(card).toContainText("Asset mix");
    await expect(card).toContainText("Next transaction block");
  });

  test("keyboard moves between tiles and shows their details", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    const section = await open(page);
    const tiles = section.locator("[data-tile]");
    await expect(section.locator("[data-tile][tabindex='0']")).toHaveCount(1);
    await section.locator("[data-tile][tabindex='0']").focus();
    await expect(page.getByTestId("goggles-tooltip")).toBeVisible();
    const first = await page.evaluate(() => document.activeElement?.getAttribute("data-id"));
    for (const key of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]) {
      await page.keyboard.press(key);
    }
    await page.keyboard.press("End");
    const last = await page.evaluate(() => document.activeElement?.getAttribute("data-id"));
    expect(last).not.toBe(first);
    expect(await tiles.count()).toBe(5);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("goggles-tooltip")).toHaveCount(0);
  });

  test("filters combine, show as removable chips and survive a reload", async ({ page }) => {
    const section = await open(page);
    const kinds = section.getByRole("group", { name: "Filter by asset kind" });
    await kinds.getByRole("button", { name: /^CAT/ }).click();
    await kinds.getByRole("button", { name: /^NFT/ }).click();
    const match = section.getByTestId("goggles-match");
    await expect(match).toContainText("Showing 2 of 5 bundles");

    await section.getByRole("button", { name: "Filters" }).click();
    await section.getByRole("textbox", { name: /Minimum fee rate/ }).fill("2");
    await expect(match).toContainText("Showing 1 of 5 bundles");
    await expect(match).toContainText(/of the block's cost/);
    await section.getByLabel("Non-matching").selectOption("hide");
    await section.getByLabel("Group by").selectOption("kind");
    await expect(section.locator("[data-tile]")).toHaveCount(1);

    const chips = section.getByRole("group", { name: "Active filters" });
    await expect(chips.getByRole("button", { name: "Remove filter CAT" })).toBeVisible();
    await expect(chips.getByRole("button", { name: "Remove filter NFT" })).toBeVisible();
    await expect(chips.getByRole("button", { name: "Remove filter ≥ 2.00 mojo/cost" })).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), PREFS_KEY))
      .toContain('"feeMin":2');

    await page.reload();
    const again = goggles(page);
    await again.scrollIntoViewIfNeeded();
    await expect(again.getByTestId("goggles-match")).toContainText("Showing 1 of 5 bundles", {
      timeout: 20_000,
    });
    await expect(again.locator("[data-tile]")).toHaveCount(1);
    const chipsAgain = again.getByRole("group", { name: "Active filters" });
    await chipsAgain.getByRole("button", { name: "Remove filter ≥ 2.00 mojo/cost" }).click();
    await expect(again.getByTestId("goggles-match")).toContainText("Showing 2 of 5 bundles");
    await chipsAgain.getByRole("button", { name: "Clear all" }).click();
    await expect(again.getByTestId("goggles-match")).toContainText("packed by fee per cost");
    await expect(again.locator("[data-tile]")).toHaveCount(5);
  });

  test("search finds bundles by asset name and bundle id", async ({ page }) => {
    const section = await open(page);
    const search = section.getByRole("searchbox", { name: /Search bundles/ });
    await search.fill("most active");
    await expect(section.getByTestId("goggles-match")).toContainText("Showing 2 of 5 bundles");
    await search.fill(`0x${ID.nft.slice(0, 8)}`);
    await expect(section.getByTestId("goggles-match")).toContainText("Showing 1 of 5 bundles");
    await section.getByRole("button", { name: "Filters" }).click();
    await section
      .getByRole("group", { name: "Asset", exact: true })
      .getByRole("button", { name: /Test Friends/ })
      .click();
    await expect(section.getByTestId("goggles-match")).toContainText("Showing 1 of 5 bundles");
  });

  test("filters that match nothing explain it instead of a blank treemap", async ({ page }) => {
    const section = await open(page);
    await section.getByRole("searchbox", { name: /Search bundles/ }).fill("nothing-like-this");
    const empty = section.getByTestId("goggles-empty");
    await expect(empty).toBeVisible();
    await expect(empty).toContainText("No bundle in the next block matches these filters.");
    await empty.getByRole("button", { name: "Clear all" }).click();
    await expect(empty).toHaveCount(0);
    await expect(section.getByTestId("goggles-match")).toContainText("packed by fee per cost");
  });
});
