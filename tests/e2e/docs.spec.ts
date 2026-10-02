import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

test.describe("docs", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("has a Why mempoolxch.space section linking the competitor matrix", async ({ page }) => {
    await page.goto("/docs");
    await expect(
      page.getByRole("heading", { level: 2, name: "Why mempoolxch.space" })
    ).toBeVisible();
    const link = page.getByRole("link", { name: "competitor matrix" });
    await expect(link).toHaveAttribute("href", /architecture\/competitors\.md/);
  });

  test("the live-updates answer describes the current client-direct channels only", async ({
    page,
  }) => {
    await page.goto("/docs#channels");
    const section = page.locator("#channels");
    await expect(section.getByText("Coinset socket", { exact: true })).toBeVisible();
    await expect(section.getByText("Server events")).toHaveCount(0);
  });
});
