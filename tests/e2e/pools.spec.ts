import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

test.describe("pools", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("groups blocks by pool payout hash, names the registry-known pool and shows the rest by address", async ({ page }) => {
    await page.goto("/pools");
    await expect(page.getByRole("heading", { level: 1, name: "Pools" })).toBeVisible();

    const table = page.getByRole("region", { name: "Share by pool" });
    await expect(table.getByText("XCHpool")).toBeVisible();
    await expect(table.getByText("Unidentified pool or solo farmer").first()).toBeVisible();

    // Half the synthetic window (two of the four rotating hashes) goes to the registry-known pool.
    await expect(page.getByText(/50\.0% of blocks/)).toBeVisible();
  });

  test("navigates from the top nav", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop nav only; mobile nav is covered by keyboard.spec.ts's touch-target test");
    await page.goto("/");
    await page.getByRole("link", { name: "Pools", exact: true }).click();
    await expect(page).toHaveURL(/\/pools/);
    await expect(page.getByRole("heading", { level: 1, name: "Pools" })).toBeVisible();
  });
});
