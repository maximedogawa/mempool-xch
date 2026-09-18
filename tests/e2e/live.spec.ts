import { expect, test } from "@playwright/test";

/** Smoke test against the real Coinset mainnet; not part of the PR suite. */
test.describe("live @live", () => {
  test.skip(!process.env.LIVE, "set LIVE=1 to run against Coinset");

  test("dashboard loads live data", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()
    ).toBeVisible({ timeout: 45_000 });
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: /Live|Polling/ })
        .first()
    ).toBeVisible({ timeout: 45_000 });
  });
});
