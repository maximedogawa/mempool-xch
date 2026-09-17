import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

test.describe("api reference", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("lists endpoints with a copyable curl example", async ({ page }) => {
    await page.goto("/api");
    await expect(page.getByRole("heading", { level: 1, name: "API reference" })).toBeVisible();
    await expect(page.getByText("get_blockchain_state", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Show example" }).first().click();
    await expect(page.getByText(/curl -s -X POST https:\/\/api\.coinset\.org/).first()).toBeVisible();
  });

  test("is reachable from the footer and the Help page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: "API", exact: true }).click();
    await expect(page).toHaveURL(/\/api$/);
  });
});
