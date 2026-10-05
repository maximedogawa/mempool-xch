import { expect, test, type Page } from "@playwright/test";
import { routes } from "../../src/shared/lib/routes";
import { fakeNftHistoryTx, fakeNftPendingTx, fakePendingTx, installFakeSage } from "./fakeSage";
import { mockCoinset, mockSummary } from "./mockCoinset";
import {
  BLOCKED_LAUNCHER_ID,
  BLOCKED_NFT_ID,
  NFT_ID,
  NFT_LAUNCHER_ID,
  mockMintGarden,
} from "./mockMintGarden";

// A tiny valid webp (1x1, opaque black), enough for the browser to decode and fire onLoad.
const TINY_WEBP = Buffer.from(
  "UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=",
  "base64"
);

/**
 * Sage in-app integration with a fake host: the dashboard shows the wallet's pending
 * transactions with their place in the queue, marks them in the feed, the treemap and the
 * projected cubes, and turns a row into "Confirmed" when the wallet drops it.
 */
test.describe("Sage wallet on the dashboard", () => {
  test("pending transaction is shown with its queue position and marked in the widgets", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const id = mockSummary().items[0]!.id;
    await mockCoinset(page);
    await installFakeSage(page, [fakePendingTx(id)]);
    await page.goto("/");
    const panel = page
      .getByRole("heading", { name: /Your transactions in flight/ })
      .locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
    await expect(page.getByText("Your transactions in flight · 1")).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      panel.getByText(/Next block · position \d+ of \d+|Projected block \d+ · position/)
    ).toBeVisible({ timeout: 20_000 });
    await expect(panel.getByText("−1.5 XCH")).toBeVisible();
    // Marks elsewhere on the dashboard.
    await expect(page.getByText("yours", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Your spend bundle/ }).first()).toBeVisible();
    await expect(page.getByLabel(/Projected block 1: .*1 of yours/).first()).toBeVisible();
    // The chime toggle must not throw in a browser without audio.
    await panel.getByRole("button", { name: /chime/i }).click();
    await panel.getByRole("button", { name: /chime/i }).click();
    expect(errors).toEqual([]);
  });

  test("a transaction the wallet drops becomes confirmed on the dashboard", async ({ page }) => {
    const id = mockSummary().items[1]!.id;
    await mockCoinset(page);
    await installFakeSage(page, [fakePendingTx(id, 250_000_000_000)]);
    await page.goto("/");
    await expect(page.getByText("Your transactions in flight · 1")).toBeVisible({
      timeout: 20_000,
    });
    await page.evaluate(() => {
      (window as unknown as { __FAKE_SAGE_PENDING__: unknown[] }).__FAKE_SAGE_PENDING__ = [];
    });
    const panel = page
      .getByText(/^Your transactions in flight/)
      .first()
      .locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
    await expect(panel.getByText(/^Confirmed/)).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText("Your transactions in flight", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(panel.getByText("−0.25 XCH")).toBeVisible();
  });

  test("an owned NFT shows its real MintGarden thumbnail, not the generic picture icon", async ({
    page,
  }) => {
    // The record MintGarden classifies the NFT by; registered first so the thumbnail route
    // below, which Playwright tries first, answers the image itself.
    await mockMintGarden(page);
    await page.route(/^https:\/\/api\.mintgarden\.io\/nfts\/.*\/thumbnail$/, (route) =>
      route.fulfill({ status: 200, contentType: "image/webp", body: TINY_WEBP })
    );
    const id = mockSummary().items[0]!.id;
    await mockCoinset(page);
    await installFakeSage(page, [fakeNftPendingTx(id, NFT_LAUNCHER_ID)]);
    await page.goto("/");
    const panel = page
      .getByRole("heading", { name: /Your transactions in flight/ })
      .locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
    await expect(panel).toBeVisible({ timeout: 20_000 });
    const thumbnail = panel.locator(
      'img[src^="https://api.mintgarden.io/nfts/"][src$="/thumbnail"]'
    );
    await expect(thumbnail).toBeVisible();
    await expect(panel.getByRole("img", { name: "NFT" })).toHaveJSProperty("complete", true);
  });
});

/**
 * TASK-098: an NFT held in the Sage wallet is classified by its MintGarden record, one request
 * per distinct NFT, before its thumbnail is shown. A blocked one keeps the neutral glyph and its
 * thumbnail is never requested; a clean one keeps its icon.
 */
test.describe("Sage wallet NFT icons are classified", () => {
  const cleanThumb = `https://api.mintgarden.io/nfts/${NFT_ID}/thumbnail`;
  const blockedThumb = `https://api.mintgarden.io/nfts/${BLOCKED_NFT_ID}/thumbnail`;

  async function routeMintGarden(page: Page) {
    const thumbnailsAsked: string[] = [];
    await mockMintGarden(page);
    await page.route(/^https:\/\/api\.mintgarden\.io\/nfts\/.*\/thumbnail$/, (route) => {
      thumbnailsAsked.push(route.request().url());
      return route.fulfill({ status: 200, contentType: "image/webp", body: TINY_WEBP });
    });
    return thumbnailsAsked;
  }

  test("in flight on the dashboard: the blocked NFT stays a glyph", async ({ page }) => {
    const thumbnailsAsked = await routeMintGarden(page);
    const [clean, blocked] = mockSummary().items;
    await mockCoinset(page);
    const blockedRecord = page.waitForResponse((r) =>
      r.url().endsWith(`/nfts/${encodeURIComponent(BLOCKED_NFT_ID)}`)
    );
    await installFakeSage(page, [
      fakeNftPendingTx(clean!.id, NFT_LAUNCHER_ID),
      fakeNftPendingTx(blocked!.id, BLOCKED_LAUNCHER_ID),
    ]);
    await page.goto("/");
    const panel = page
      .getByRole("heading", { name: /Your transactions in flight/ })
      .locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
    await expect(panel.locator(`img[src="${cleanThumb}"]`)).toBeVisible({ timeout: 20_000 });
    // Its verdict is in, and it still shows no artwork.
    await blockedRecord;
    await expect(panel.locator(`img[src="${blockedThumb}"]`)).toHaveCount(0);
    await expect(panel.getByRole("img", { name: "NFT" })).toHaveCount(1);
    expect(thumbnailsAsked).not.toContain(blockedThumb);
  });

  test("on the wallet page: asset tiles and history rows keep a blocked NFT a glyph", async ({
    page,
  }) => {
    const thumbnailsAsked = await routeMintGarden(page);
    await mockCoinset(page);
    const blockedRecord = page.waitForResponse((r) =>
      r.url().endsWith(`/nfts/${encodeURIComponent(BLOCKED_NFT_ID)}`)
    );
    await installFakeSage(page, [], undefined, undefined, [
      fakeNftHistoryTx("11".repeat(32), NFT_LAUNCHER_ID, 9_300_010),
      fakeNftHistoryTx("22".repeat(32), BLOCKED_LAUNCHER_ID, 9_300_011),
    ]);
    await page.goto(routes.wallet());
    await expect(page.getByRole("heading", { name: /^Assets · 3/ })).toBeVisible({
      timeout: 20_000,
    });
    const assets = page.locator("main");
    await expect(assets.locator(`a[href*="${NFT_ID}"] img[src="${cleanThumb}"]`)).toBeVisible({
      timeout: 20_000,
    });
    await blockedRecord;
    // The blocked NFT's tile is there, with the glyph in place of its artwork.
    await expect(assets.locator(`a[href*="${BLOCKED_NFT_ID}"]`)).toBeVisible();
    await expect(assets.locator(`a[href*="${BLOCKED_NFT_ID}"] img`)).toHaveCount(0);
    await expect(page.locator(`img[src="${blockedThumb}"]`)).toHaveCount(0);
    // The history rows: the clean NFT's icon, and one glyph for the blocked one.
    await page.getByRole("tab", { name: /^Transactions/ }).click();
    await expect(page.getByRole("link", { name: /block 9,300,011/i })).toBeVisible();
    await expect(assets.locator(`li img[src="${cleanThumb}"]`)).toBeVisible();
    await expect(assets.locator("li").getByRole("img", { name: "NFT" })).toHaveCount(1);
    await expect(page.locator(`img[src="${blockedThumb}"]`)).toHaveCount(0);
    expect(thumbnailsAsked).not.toContain(blockedThumb);
  });
});
