import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

const SNAPSHOT_KEY = "mempool-xch:mempool-snapshot:v1:mainnet";

test.describe("performance behaviour", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("a reload paints the mempool from the snapshot and downloads no known item again", async ({
    page,
  }) => {
    let itemFetches = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/get_mempool_item_by_tx_id")) itemFetches += 1;
    });
    const projected = page
      .getByRole("list", { name: "Projected next blocks" })
      .getByRole("listitem")
      .first();

    await page.goto("/");
    await expect(projected).toBeVisible();
    expect(itemFetches).toBeGreaterThan(0);
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key) !== null, SNAPSHOT_KEY))
      .toBe(true);

    itemFetches = 0;
    await page.reload();
    await expect(projected).toBeVisible();
    // The id list is unchanged, so the seeded sync has nothing left to fetch.
    await expect(page.getByText("Next block", { exact: true }).first()).toBeVisible();
    expect(itemFetches).toBe(0);
  });

  test("a broken snapshot is ignored and the dashboard still loads", async ({ page }) => {
    await page.addInitScript((key) => window.localStorage.setItem(key, "{not json"), SNAPSHOT_KEY);
    await page.goto("/");
    await expect(
      page.getByRole("list", { name: "Projected next blocks" }).getByRole("listitem").first()
    ).toBeVisible();
  });

  test("the widgets below the fold mount without scrolling", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Latest transactions")).toBeVisible();
    await expect(page.getByText("Latest blocks")).toBeVisible();
  });
});
