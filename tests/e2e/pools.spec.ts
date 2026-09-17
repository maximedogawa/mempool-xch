import { expect, test } from "@playwright/test";
import { mockCoinset, PLOT_NFT_PUZZLE_HASHES } from "./mockCoinset";

test.describe("pools", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("groups PlotNFT farmers under the pool that claims their rewards, next to fixed-address pools", async ({ page }) => {
    await page.goto("/pools");
    await expect(page.getByRole("heading", { level: 1, name: "Pools" })).toBeVisible();

    const table = page.getByRole("region", { name: "Share by pool" });
    // Two synthetic farmers, a quarter of the window each, both claimed to Spacefarmers.io's pool_info target.
    const spacefarmers = table.getByRole("row").filter({ hasText: "Spacefarmers.io" });
    await expect(spacefarmers.getByText("50.00%")).toBeVisible();
    await expect(spacefarmers.getByRole("link", { name: /^xch1/ })).toHaveCount(2);
    // H9.com's fixed payout address needs no claim to be named.
    await expect(table.getByRole("row").filter({ hasText: "H9.com" }).getByText("25.00%")).toBeVisible();
    // A both-shares address is nobody's PlotNFT: it stays a row of its own.
    const unknown = table.getByRole("row").filter({ hasText: "Unknown" });
    await expect(unknown.getByText("both shares")).toBeVisible();
    await expect(unknown.getByText("25.00%")).toBeVisible();

    await expect(page.getByText("Named pools").locator("..").locator("..")).toContainText("75.0%");
  });

  test("resolved claims are remembered, so a second visit asks Coinset nothing new", async ({ page }) => {
    await page.goto("/pools");
    const table = page.getByRole("region", { name: "Share by pool" });
    await expect(table.getByRole("row").filter({ hasText: "Spacefarmers.io" }).getByText("50.00%")).toBeVisible();

    let lookups = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/get_transactions_by_p2")) lookups += 1;
    });
    await page.reload();
    await expect(table.getByRole("row").filter({ hasText: "Spacefarmers.io" }).getByText("50.00%")).toBeVisible();
    expect(lookups).toBe(0);
  });

  test("search filters by pool name and by payout address", async ({ page }) => {
    await page.goto("/pools");
    const table = page.getByRole("region", { name: "Share by pool" });
    await expect(table.getByRole("link", { name: "H9.com" })).toBeVisible();

    const search = page.getByRole("searchbox", { name: "Search pool or address" });
    await search.fill("h9");
    await expect(table.getByRole("link", { name: "H9.com" })).toBeVisible();
    await expect(table.getByRole("link", { name: "Spacefarmers.io" })).toHaveCount(0);

    await search.fill(PLOT_NFT_PUZZLE_HASHES[0]!);
    await expect(table.getByRole("link", { name: "Spacefarmers.io" })).toBeVisible();
    await expect(table.getByRole("link", { name: "H9.com" })).toHaveCount(0);

    await search.fill("no such pool");
    await expect(page.getByText('No pool or address matches "no such pool".')).toBeVisible();

    await search.fill("");
    await expect(table.getByRole("link", { name: "H9.com" })).toBeVisible();
  });

  test("navigates from the top nav", async ({ page, isMobile }) => {
    test.skip(
      isMobile,
      "desktop nav only; mobile nav is covered by keyboard.spec.ts's touch-target test"
    );
    await page.goto("/");
    await page.getByRole("link", { name: "Pools", exact: true }).click();
    await expect(page).toHaveURL(/\/pools/);
    await expect(page.getByRole("heading", { level: 1, name: "Pools" })).toBeVisible();
  });
});
