import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

test.describe("fees", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("shows the node estimate, rate distribution and transfer-cost table, consistent with the fixture", async ({
    page,
  }) => {
    await page.goto("/fees");
    await expect(page.getByRole("heading", { level: 1, name: "Fees" })).toBeVisible();

    // The mocked get_fee_estimate answers a fixed 60s-target estimate (373,687 mojo) regardless
    // of the requested target list, so only the first (60s / "within 1 min") tile is checked
    // for its exact value here; the fixture's own semantics are covered by fees.test.ts.
    await expect(page.getByText("Within 1 min")).toBeVisible();
    await expect(page.getByText("373,687 mojo")).toBeVisible();
    for (const label of ["Within 2 min", "Within 5 min", "Within 10 min", "Within 30 min"]) {
      await expect(page.getByText(label)).toBeVisible();
    }

    const distribution = page.getByRole("region", { name: "Rate distribution" });
    const bracketLabels = distribution.locator("tbody td:first-child");
    await expect(bracketLabels).toHaveText([
      "0",
      "0-1",
      "1-3",
      "3-5",
      "5-10",
      "10-25",
      "25-50",
      "50+",
    ]);

    const costs = page.getByRole("region", { name: "What a transfer costs" });
    for (const label of [
      "Plain transfer",
      "Transfer with 3 inputs",
      "Send a CAT",
      "Transfer an NFT",
      "Accept an offer",
    ]) {
      await expect(costs.getByText(label)).toBeVisible();
    }

    await expect(page.getByRole("heading", { name: "Fees per transaction block" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Median fee rate" })).toBeVisible();
    await expect(page.getByText(/Not sampled at chart scale/).first()).toBeVisible();
  });

  test("range control on the fees page charts is keyboard accessible", async ({ page }) => {
    await page.goto("/fees");
    const rangeGroup = page.getByRole("radiogroup", { name: "Range", exact: true });
    const week = rangeGroup.getByRole("radio", { name: "7d" });
    await week.focus();
    await week.press("Enter");
    await expect(week).toHaveAttribute("aria-checked", "true");
  });
});
