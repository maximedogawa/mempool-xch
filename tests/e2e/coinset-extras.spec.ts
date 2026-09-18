import { expect, test } from "@playwright/test";
import { mockCoinset, mockCustomNode, OFFER_CAT_ASSET_ID, OFFER_ID, P2, TX_ID } from "./mockCoinset";

test.describe("Coinset offers, clawbacks, reorgs and raw transactions", () => {
  test("offer page shows state, both sides, maker and settlement", async ({ page }) => {
    await mockCoinset(page);
    await page.goto(`/offer/${OFFER_ID}`);
    await expect(page.getByRole("heading", { level: 1, name: "Offer" })).toBeVisible();
    await expect(page.getByText("Taken", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Maker offers")).toBeVisible();
    await expect(page.getByText("Maker requests")).toBeVisible();
    await expect(page.getByText("60 XCH")).toBeVisible();
    await expect(page.getByText(/Maker addresses/)).toBeVisible();
    await expect(page.getByText(/Taken in transaction/)).toBeVisible();
    await expect(page.getByRole("link", { name: "#9,308,382" })).toBeVisible();
  });

  test("unknown offer id explains that it is not indexed", async ({ page }) => {
    await mockCoinset(page);
    await page.goto(`/offer/${"ab".repeat(32)}`);
    await expect(page.getByText("Offer not indexed")).toBeVisible();
  });

  test("search resolves an offer id and explains a pasted offer file", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/");
    const box = page.getByRole("searchbox").first();
    await box.fill(OFFER_ID);
    await box.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/offer/${OFFER_ID}`));

    await page.goto("/");
    await box.fill("offer1qqr83wcuu2rykcmqvpsxygqqemhmlaekcenaz02ma6hs5w600dhjlvfjn477nl");
    await box.press("Enter");
    await expect(page.getByText(/That is an offer file, not an id/)).toBeVisible();
  });

  test("CAT page lists offers involving the token with a status filter", async ({ page }) => {
    await mockCoinset(page);
    await page.goto(`/cat/${OFFER_CAT_ASSET_ID}`);
    await expect(page.getByRole("heading", { name: "Offers involving this token" })).toBeVisible();
    const list = page.getByTestId("offers-list");
    await expect(list.getByRole("link", { name: "details" })).toHaveCount(2);
    await expect(list.getByText("40 XCH")).toBeVisible();
    await page.getByRole("group", { name: "Offer status" }).getByRole("button", { name: "Cancelled" }).click();
    await expect(page.getByText("No cancelled offers indexed for this asset.")).toBeVisible();
  });

  test("address page shows clawback coins and offers made from it", async ({ page }) => {
    await mockCoinset(page);
    await page.goto(`/address/${P2}`);
    await expect(page.getByRole("heading", { name: "Clawback coins" })).toBeVisible();
    await expect(page.getByText("sender can claw back")).toBeVisible();
    await expect(page.getByText("24h 0m", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Offers made from this address" })).toBeVisible();
  });

  test("confirmed transaction shows its coin spends from the raw item", async ({ page }) => {
    await mockCoinset(page);
    await page.goto(`/tx/${TX_ID}`);
    await expect(page.getByRole("heading", { name: /Coin spends \(\d+\)/ })).toBeVisible();
    await expect(page.getByText(/as seen in the mempool/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Show raw JSON/ })).toHaveCount(2);
  });

  test("dashboard shows netspace and the last reorg; blocks page lists reorg history", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/");
    await expect(page.getByTestId("netspace")).not.toHaveText("…");
    await expect(page.getByTestId("reorg-indicator")).toContainText("1 block at #9,306,354");
    await page.goto("/blocks");
    await expect(page.getByRole("heading", { name: "Reorg history" })).toBeVisible();
    await expect(page.getByRole("link", { name: "#9,306,354" })).toBeVisible();
    await expect(page.getByText("1 block", { exact: true })).toHaveCount(3);
  });

  test("none of it renders on a custom node", async ({ page }) => {
    await mockCustomNode(page);
    await page.goto(`/address/${P2}`);
    await expect(page.getByRole("heading", { name: "Address" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Clawback coins" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Offers made from this address" })).toHaveCount(0);
    await page.goto("/blocks");
    await expect(page.getByRole("heading", { name: "Reorg history" })).toHaveCount(0);
    await page.goto(`/offer/${OFFER_ID}`);
    await expect(page.getByText("Offers need Coinset")).toBeVisible();
  });
});
