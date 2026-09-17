import { expect, test } from "@playwright/test";
import { fakeNftPendingTx, fakePendingTx, installFakeSage } from "./fakeSage";
import { mockCoinset, mockSummary } from "./mockCoinset";

// A tiny valid webp (1x1, opaque black), enough for the browser to decode and fire onLoad.
const TINY_WEBP = Buffer.from("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=", "base64");

/**
 * Sage in-app integration with a fake host: the dashboard shows the wallet's pending
 * transactions with their place in the queue, marks them in the feed, the treemap and the
 * projected cubes, and turns a row into "Confirmed" when the wallet drops it.
 */
test.describe("Sage wallet on the dashboard", () => {
  test("pending transaction is shown with its queue position and marked in the widgets", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const id = mockSummary().items[0]!.id;
    await mockCoinset(page);
    await installFakeSage(page, [fakePendingTx(id)]);
    await page.goto("/");
    const panel = page.getByRole("heading", { name: /Your transactions in flight/ }).locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
    await expect(page.getByText("Your transactions in flight · 1")).toBeVisible({ timeout: 20_000 });
    await expect(panel.getByText(/Next block · position \d+ of \d+|Projected block \d+ · position/)).toBeVisible({ timeout: 20_000 });
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
    await expect(page.getByText("Your transactions in flight · 1")).toBeVisible({ timeout: 20_000 });
    await page.evaluate(() => {
      (window as unknown as { __FAKE_SAGE_PENDING__: unknown[] }).__FAKE_SAGE_PENDING__ = [];
    });
    const panel = page.getByText(/^Your transactions in flight/).first().locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
    await expect(panel.getByText(/^Confirmed/)).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText("Your transactions in flight", { exact: true })).toBeVisible({ timeout: 20_000 });
    await expect(panel.getByText("−0.25 XCH")).toBeVisible();
  });

  test("an owned NFT shows its real MintGarden thumbnail, not the generic picture icon", async ({ page }) => {
    await page.route(/^https:\/\/api\.mintgarden\.io\/nfts\/.*\/thumbnail$/, (route) =>
      route.fulfill({ status: 200, contentType: "image/webp", body: TINY_WEBP })
    );
    const id = mockSummary().items[0]!.id;
    await mockCoinset(page);
    await installFakeSage(page, [fakeNftPendingTx(id)]);
    await page.goto("/");
    const panel = page.getByRole("heading", { name: /Your transactions in flight/ }).locator("xpath=ancestor::*[contains(@class,'card-lift')][1]");
    await expect(panel).toBeVisible({ timeout: 20_000 });
    const thumbnail = panel.locator('img[src^="https://api.mintgarden.io/nfts/"][src$="/thumbnail"]');
    await expect(thumbnail).toBeVisible();
    await expect(panel.getByRole("img", { name: "NFT" })).toHaveJSProperty("complete", true);
  });
});
