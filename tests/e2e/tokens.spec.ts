import { expect, test } from "@playwright/test";
import { mockCoinset, mockDexie } from "./mockCoinset";

test.describe("tokens", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockDexie(page);
  });

  test("opens on traded tokens ranked by XCH volume, without asking Coinset per token", async ({
    page,
  }) => {
    let activityCalls = 0;
    await page.route("**/get_transactions_by_cat_asset_id", (route) => {
      activityCalls++;
      return route.fallback();
    });
    await page.goto("/tokens");
    await expect(page.getByRole("heading", { level: 1, name: "Tokens" })).toBeVisible();

    const table = page.getByRole("region", { name: "Tokens" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("Most Active Token");
    await expect(rows.nth(0)).toContainText("2,211");
    await expect(rows.nth(0)).toContainText("0.0125");
    await expect(rows.nth(1)).toContainText("Quiet Token");
    await expect(table.getByText("Silent Token")).toBeHidden();
    expect(activityCalls).toBe(0);
  });

  test("period, filter and sort change what is listed", async ({ page }) => {
    await page.goto("/tokens");
    const table = page.getByRole("region", { name: "Tokens" });
    const rows = table.locator("tbody tr");
    await expect(rows).toHaveCount(2);

    await page
      .getByRole("radiogroup", { name: "Period" })
      .getByRole("radio", { name: "7d" })
      .click();
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("Most Active Token");

    const show = page.getByRole("radiogroup", { name: "Show" });
    await show.getByRole("radio", { name: /^Priced/ }).click();
    await expect(rows).toHaveCount(3);

    await show.getByRole("radio", { name: /^All/ }).click();
    await expect(rows).toHaveCount(5);
    await page
      .getByRole("radiogroup", { name: "Sort" })
      .getByRole("radio", { name: "Liquidity" })
      .click();
    await expect(rows.first()).toContainText("Quiet Token");
  });

  test("searches within the view and links to the CAT page", async ({ page }) => {
    await page.goto("/tokens");
    const table = page.getByRole("region", { name: "Tokens" });
    await page
      .getByRole("radiogroup", { name: "Show" })
      .getByRole("radio", { name: /^All/ })
      .click();
    await expect(table.getByText("Alpha Coin")).toBeVisible();

    await page.getByRole("searchbox", { name: "Search tokens" }).fill("quiet");
    await expect(table.getByText("Quiet Token")).toBeVisible();
    await expect(table.getByText("Alpha Coin")).not.toBeVisible();

    await table.getByText("Quiet Token").click();
    await expect(page).toHaveURL(/\/cat\//);
  });

  test("falls back to the whole registry when Dexie market data is down", async ({ page }) => {
    await page.route(/https:\/\/api\.dexie\.space\/v3\/prices\/tickers.*/, (route) =>
      route.fulfill({ status: 503, body: "" })
    );
    await page.goto("/tokens");
    const table = page.getByRole("region", { name: "Tokens" });
    await expect(table.locator("tbody tr")).toHaveCount(5, { timeout: 15_000 });
    await expect(page.getByText(/Dexie market data is unavailable/)).toBeVisible();
  });
});
