import { expect, test } from "@playwright/test";
import { mockCoinset, P2, TX_ID } from "./mockCoinset";

test.describe("detail pages", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("confirmed transaction shows block, kind, coin flow, farmed by and a verdict", async ({ page }) => {
    await page.goto(`/tx/${TX_ID}`);
    await expect(page.getByRole("heading", { level: 1, name: "Transaction" })).toBeVisible();
    await expect(page.getByText("Confirmed", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "9,295,514" }).first()).toBeVisible();
    await expect(page.getByText(/Inputs/i).first()).toBeVisible();
    await expect(page.getByText("7.50 mojo/cost")).toBeVisible();
    const farmedBy = page.getByTestId("farmed-by");
    await expect(farmedBy).toContainText("unidentified solo farmer");
    await expect(farmedBy.getByRole("link", { name: "block details" })).toBeVisible();
    await expect(page.getByText(/Waited .* before confirming/)).toBeVisible();
  });

  test("unknown transaction shows a not-found state", async ({ page }) => {
    await page.goto(`/tx/${"ee".repeat(32)}`);
    await expect(page.getByText(/not found/i).first()).toBeVisible();
  });

  test("query-param form of a detail route works too", async ({ page }) => {
    await page.goto(`/tx?id=${TX_ID}`);
    await expect(page.getByRole("link", { name: "9,295,514" }).first()).toBeVisible();
  });

  test("address page resolves a raw puzzle hash and shows balances", async ({ page }) => {
    await page.goto(`/address/${P2}`);
    await expect(page.getByText(/673\.04/).first()).toBeVisible();
    await expect(page.locator("svg").filter({ has: page.locator("path") }).first()).toBeVisible();
  });
});
