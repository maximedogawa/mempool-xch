import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";
import { mockDexieOffers, mockMintGarden, NFT_ID } from "./mockMintGarden";

test.describe("NFT section", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockMintGarden(page);
    await mockDexieOffers(page);
  });

  test("home shows top collections, recent activity and recent mints", async ({ page }) => {
    await page.goto("/nfts");
    await expect(page.getByRole("heading", { level: 1, name: "NFTs" })).toBeVisible();
    await expect(page.getByText("Test Friends").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent activity" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New mints" })).toBeVisible();
    await expect(page.getByText("Test Friend #1").first()).toBeVisible();
  });

  test("collections page lists collections with floor and volume", async ({ page }) => {
    await page.goto("/nfts/collections");
    await expect(page.getByRole("heading", { level: 1, name: "NFT collections" })).toBeVisible();
    const table = page.getByRole("region", { name: "Collections" });
    await expect(table.getByText("Test Friends")).toBeVisible();
    await expect(table.getByText("1.25 XCH")).toBeVisible();
  });

  test("activity page filters by kind", async ({ page }) => {
    await page.goto("/nfts/activity");
    await expect(page.getByRole("heading", { level: 1, name: "NFT activity" })).toBeVisible();
    await expect(page.getByText("Sale", { exact: true }).first()).toBeVisible();
    await page.getByRole("radio", { name: "Mints" }).click();
    await expect(page.getByText("Mint", { exact: true }).first()).toBeVisible();
  });

  test("mints page lists only mints", async ({ page }) => {
    await page.goto("/nfts/mints");
    await expect(page.getByRole("heading", { level: 1, name: "New mints" })).toBeVisible();
    await expect(page.getByText("Mint", { exact: true }).first()).toBeVisible();
  });

  test("item page shows open offers with a copy action and a Dexie link", async ({ page }) => {
    await page.goto(`/nft/${NFT_ID}`);
    await expect(page.getByRole("heading", { name: /Open offers/ })).toBeVisible();
    await expect(page.getByText("1.25 XCH")).toBeVisible();
    await expect(page.getByRole("link", { name: /View on Dexie/ })).toBeVisible();
    await expect(
      page.getByText(/Sage's app bridge does not yet expose a way to accept an offer/)
    ).toBeVisible();
  });

  test("NFTs nav link reaches the home page", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop nav only");
    await page.goto("/");
    await page.getByRole("link", { name: "NFTs", exact: true }).click();
    await expect(page).toHaveURL(/\/nfts$/);
  });
});
