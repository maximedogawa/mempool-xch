import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

test.describe("pools", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("groups blocks by pool payout hash, names the registry-known pool and shows the rest by address", async ({
    page,
  }) => {
    await page.goto("/pools");
    await expect(page.getByRole("heading", { level: 1, name: "Pools" })).toBeVisible();

    const table = page.getByRole("region", { name: "Share by pool" });
    await expect(table.getByRole("link", { name: "H9.com" })).toBeVisible();
    await expect(table.getByText("Unidentified").first()).toBeVisible();

    // Half the synthetic window (two of the four rotating hashes) goes to the registry-known pool.
    const namedRow = table.locator("li").filter({ hasText: "H9.com" });
    await expect(namedRow.getByText("50.0%")).toBeVisible();
  });

  test("search filters the pool list by name", async ({ page }) => {
    await page.goto("/pools");
    const table = page.getByRole("region", { name: "Share by pool" });
    await expect(table.getByRole("link", { name: "H9.com" })).toBeVisible();
    await expect(table.getByText("Unidentified").first()).toBeVisible();

    const search = page.getByRole("searchbox", { name: "Search pool name" });
    await search.fill("h9");
    await expect(table.getByRole("link", { name: "H9.com" })).toBeVisible();
    await expect(table.getByText("Unidentified")).toHaveCount(0);

    await search.fill("no such pool");
    await expect(page.getByText('No pool matches "no such pool".')).toBeVisible();

    await search.fill("");
    await expect(table.getByRole("link", { name: "H9.com" })).toBeVisible();
    await expect(table.getByText("Unidentified").first()).toBeVisible();
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
