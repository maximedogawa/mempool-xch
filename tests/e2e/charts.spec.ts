import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

test.describe("charts", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
  });

  test("every series is listed, real or greyed with a note, each with a definition", async ({ page }) => {
    await page.goto("/charts");
    await expect(page.getByRole("heading", { level: 1, name: "Charts" })).toBeVisible();

    // Market and Coin set are always unavailable today (no verified source); still listed with a note.
    await expect(page.getByRole("heading", { name: "XCH price (USD)" })).toBeVisible();
    await expect(page.getByText(/No verified public price-history endpoint/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unspent coins" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Active puzzle hashes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Coin age" })).toBeVisible();
    await expect(page.getByText(/no aggregate endpoint for this/).first()).toBeVisible();

    // Cost/spends per transaction block are a sampling-cost tradeoff, not a provider limit.
    await expect(page.getByRole("heading", { name: "Cost per transaction block" })).toBeVisible();
    await expect(page.getByText(/Not sampled at chart scale/).first()).toBeVisible();

    // Every chart, real or greyed, carries its definition and technical note.
    const definitions = page.getByText("Definition & technical note");
    expect(await definitions.count()).toBeGreaterThanOrEqual(15);
  });

  test("range, smoothing and scale controls are keyboard-accessible radiogroups", async ({ page }) => {
    await page.goto("/charts");
    const rangeGroup = page.getByRole("radiogroup", { name: "Range", exact: true });
    const day = rangeGroup.getByRole("radio", { name: "24h" });
    const week = rangeGroup.getByRole("radio", { name: "7d" });
    await expect(day).toHaveAttribute("aria-checked", "true");
    await expect(week).toHaveAttribute("aria-checked", "false");

    await week.focus();
    await week.press("Enter");
    await expect(week).toHaveAttribute("aria-checked", "true");
    await expect(day).toHaveAttribute("aria-checked", "false");

    const scaleGroup = page.getByRole("radiogroup", { name: "Scale", exact: true });
    const log = scaleGroup.getByRole("radio", { name: "Log" });
    await log.focus();
    await log.press("Enter");
    await expect(log).toHaveAttribute("aria-checked", "true");
  });

  test("mempool charts read the existing 2h browser sample, unavailable outside it", async ({ page }) => {
    await page.goto("/charts");
    await expect(page.getByRole("heading", { name: "Cost used" })).toBeVisible();
    // Freshly loaded in this test, the 2h sampler has under two points yet: shows the note.
    await expect(page.getByText(/sampled in this browser/).first()).toBeVisible();

    const rangeGroup = page.getByRole("radiogroup", { name: "Range", exact: true });
    await rangeGroup.getByRole("radio", { name: "30d" }).click();
    await expect(page.getByText(/Only the last 2 hours are sampled/).first()).toBeVisible();
  });
});
