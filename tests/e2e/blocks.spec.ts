import { expect, test, type Page } from "@playwright/test";
import { mockCoinset, TX_BLOCK_HEIGHT, TX_ID } from "./mockCoinset";

function row(page: Page, label: string) {
  return page.locator("dl > div").filter({ has: page.locator("dt", { hasText: new RegExp(`^${label}$`) }) });
}

test.describe("block pages", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("block page resolves a pretty URL after a hard load", async ({ page }) => {
    await page.goto(`/block/${TX_BLOCK_HEIGHT}`);
    await expect(page.getByRole("heading", { name: /Block 9,295,514/ })).toBeVisible();
    await expect(page.getByText("7bcb5225f8b612363e3e4edfbe0699ed13135570336a23c694c57add8e778cef")).toBeVisible();
    await expect(page.getByRole("link", { name: new RegExp(TX_ID.slice(0, 6)) }).first()).toBeVisible();
  });

  test("non-transaction block explains itself and links to transaction blocks", async ({ page }) => {
    await page.goto("/block/9295513");
    await expect(page.getByRole("heading", { name: /Block 9,295,513/ })).toBeVisible();
    await expect(page.getByText(/no spends|carries no transactions|non-transaction/i).first()).toBeVisible();
    await expect(row(page, "Signage point")).toContainText("36 of 64");
    await expect(row(page, "Deficit")).toContainText("1");
    await expect(row(page, "Sub-epoch summary")).toContainText("No");
    await expect(row(page, "Previous transaction block")).toContainText("9,295,512");
    await expect(row(page, "Block reward")).toContainText("1 XCH");
    // This block's payout address is a real self-pooling PlotNFT; the mock serves its recorded claim.
    await expect(page.getByTestId("farmed-by")).toContainText("Self-pooling farmer (PlotNFT), rewards claimed to xch1");
  });

  test("transaction block shows parity properties, contents and the coin flow", async ({ page }) => {
    await page.goto(`/block/${TX_BLOCK_HEIGHT}`);
    await expect(row(page, "Signage point")).toContainText("40 of 64");
    await expect(row(page, "Deficit")).toContainText("0");
    // This fixture's pool_puzzle_hash is a recorded real address, since verified as NoSSD's (src/shared/lib/pools/registry.json).
    await expect(page.getByTestId("farmed-by")).toContainText("NoSSD");
    await expect(row(page, "Farmer reward address")).toContainText("xch1");
    await expect(page.getByTestId("block-contents")).toHaveText("3 spends · 15 new coins");
    await expect(row(page, "Generator")).toContainText("one block generator");

    const flow = page.getByRole("list", { name: "Spent coins and the coins they created" });
    await expect(flow.getByRole("listitem").filter({ has: page.getByRole("list", { name: "12 coins created" }) })).toBeVisible();
    const twelve = page.getByRole("list", { name: "12 coins created" });
    await expect(twelve.getByRole("listitem")).toHaveCount(10);
    await page.getByRole("button", { name: "Show 2 more" }).click();
    await expect(twelve.getByRole("listitem")).toHaveCount(12);
    await expect(page.getByText("spent in this block").first()).toBeVisible();
    await expect(page.getByRole("region", { name: "Reward coins" })).toContainText("0.875");
  });

  test("blocks list paginates and filters", async ({ page }) => {
    await page.goto("/blocks");
    await expect(page.getByRole("link", { name: "9,295,514" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "9,295,513" }).first()).toBeVisible();
    await page.getByLabel(/transaction blocks only/i).check();
    await expect(page.getByRole("link", { name: "9,295,513" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "9,295,514" }).first()).toBeVisible();
  });

  test("mempool table sorts by column", async ({ page }) => {
    await page.goto("/mempool");
    const table = page.getByRole("table").first();
    await expect(table.getByRole("row")).toHaveCount(4); // header + 3 fixture items
    // "Age" stays visible on phones; the cost column is hidden under sm.
    await table.getByRole("button", { name: /^age$/i }).click();
    await expect(page.getByRole("columnheader", { name: /^age$/i })).toHaveAttribute("aria-sort", /ascending|descending/);
  });
});
