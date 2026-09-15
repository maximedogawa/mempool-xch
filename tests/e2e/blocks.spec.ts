import { expect, test } from "@playwright/test";
import { mockCoinset, TX_BLOCK_HEIGHT, TX_ID } from "./mockCoinset";

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
  });

  test("blocks list paginates and filters", async ({ page }) => {
    await page.goto("/blocks");
    await expect(page.getByRole("link", { name: "9,295,519" }).first()).toBeVisible();
    await page.getByLabel(/transaction blocks only/i).check();
    await expect(page.getByRole("link", { name: "9,295,513" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "9,295,514" }).first()).toBeVisible();
  });

  test("mempool table sorts by column", async ({ page }) => {
    await page.goto("/mempool");
    const table = page.getByRole("table").first();
    await expect(table.getByRole("row")).toHaveCount(4); // header + 3 fixture items
    await page.getByRole("columnheader", { name: /cost/i }).filter({ hasNotText: /fee/i }).first().click();
    await expect(page.getByRole("columnheader", { name: /cost/i }).filter({ hasNotText: /fee/i }).first()).toHaveAttribute("aria-sort", /ascending|descending/);
  });
});
