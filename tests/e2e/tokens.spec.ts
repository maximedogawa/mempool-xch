import { expect, test } from "@playwright/test";
import { mockCoinset, mockDexie } from "./mockCoinset";

test.describe("tokens", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockDexie(page);
  });

  test("lists every known token by name, searches and links to the CAT page", async ({ page }) => {
    await page.goto("/tokens");
    await expect(page.getByRole("heading", { level: 1, name: "Tokens" })).toBeVisible();

    const table = page.getByRole("region", { name: "Tokens" });
    await expect(table.getByText("Most Active Token")).toBeVisible();
    await expect(table.getByText("Quiet Token")).toBeVisible();
    await expect(table.getByText("Alpha Coin")).toBeVisible();

    await page.getByRole("searchbox", { name: "Search tokens" }).fill("quiet");
    await expect(table.getByText("Quiet Token")).toBeVisible();
    await expect(table.getByText("Alpha Coin")).not.toBeVisible();

    await table.getByText("Quiet Token").click();
    await expect(page).toHaveURL(/\/cat\//);
  });

  test("scanning by most active ranks the busy token first and marks it capped", async ({
    page,
  }) => {
    await page.goto("/tokens");
    const sortGroup = page.getByRole("radiogroup", { name: "Sort" });
    await sortGroup.getByRole("radio", { name: "Most active" }).click();
    await page.getByRole("button", { name: "Scan tokens" }).click();
    await expect(page.getByText(/Scanning…/)).toBeHidden({ timeout: 15_000 });

    const table = page.getByRole("region", { name: "Tokens" });
    const rows = table.locator("tbody tr");
    await expect(rows.first()).toContainText("Most Active Token");
    await expect(rows.first()).toContainText("10+");
  });
});

test("token activity recovers after an opaque upstream failure without a request burst", async ({
  page,
}) => {
  await mockCoinset(page);
  await mockDexie(page);
  let failed = false;
  let active = 0;
  let maximum = 0;
  await page.route("**/get_transactions_by_cat_asset_id", async (route) => {
    active++;
    maximum = Math.max(maximum, active);
    try {
      await new Promise((resolve) => setTimeout(resolve, 30));
      if (!failed) {
        failed = true;
        await route.abort("failed");
      } else await route.fallback();
    } finally {
      active--;
    }
  });
  await page.goto("/tokens");
  const row = page.getByRole("row").filter({ hasText: "Most Active Token" });
  await expect(row).toContainText("10+", { timeout: 15_000 });
  expect(failed).toBe(true);
  // The shared Coinset read gate (src/shared/lib/rpc/readGate.ts) allows 5 requests in flight.
  expect(maximum).toBeLessThanOrEqual(5);
});
