import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";
import {
  BLOCKED_NFT_ID,
  VIDEO_NFT_ID,
  VIDEO_URL,
  mockDexieOffers,
  mockMintGarden,
  NFT_ID,
} from "./mockMintGarden";

test.describe("NFT section", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockMintGarden(page);
    await mockDexieOffers(page);
  });

  test("home shows top collections, recent activity and recent mints", async ({ page }) => {
    await page.goto("/nfts");
    await expect(page.getByRole("heading", { level: 1, name: "NFTs" })).toBeVisible();
    await expect(page.getByText("Test Friends").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent activity" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "New mints" })).toBeVisible();
    await expect(page.getByText("Test Friend #1").first()).toBeVisible();
  });

  test("collections page lists collections with floor and volume", async ({ page }) => {
    await page.goto("/nfts/collections");
    await expect(page.getByRole("heading", { level: 1, name: "NFT collections" })).toBeVisible();
    const table = page.getByRole("region", { name: "Collections" });
    await expect(table.getByText("Test Friends")).toBeVisible();
    await expect(table.getByText("1.25 XCH")).toBeVisible();
  });

  test("activity page filters by kind", async ({ page }) => {
    await page.goto("/nfts/activity");
    await expect(page.getByRole("heading", { level: 1, name: "NFT activity" })).toBeVisible();
    await expect(page.getByText("Sale", { exact: true }).first()).toBeVisible();
    await page.getByRole("radio", { name: "Mints" }).click();
    await expect(page.getByText("Mint", { exact: true }).first()).toBeVisible();
  });

  test("mints page lists only mints", async ({ page }) => {
    await page.goto("/nfts/mints");
    await expect(page.getByRole("heading", { level: 1, name: "New mints" })).toBeVisible();
    await expect(page.getByText("Mint", { exact: true }).first()).toBeVisible();
  });

  test("item page shows open offers with a copy action and a Dexie link", async ({ page }) => {
    await page.goto(`/nft/${NFT_ID}`);
    await expect(page.getByRole("heading", { name: /Open offers/ })).toBeVisible();
    await expect(page.getByText("1.25 XCH")).toBeVisible();
    await expect(page.getByRole("link", { name: /View on Dexie/ })).toBeVisible();
    await expect(
      page.getByText(/Sage's app bridge does not yet expose a way to accept an offer/)
    ).toBeVisible();
  });

  test("NFTs nav link reaches the home page", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop nav only");
    await page.goto("/");
    // NFTs lives under the header's More menu, not the top bar.
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("menuitem", { name: "NFTs" }).click();
    await expect(page).toHaveURL(/\/nfts$/);
  });
});

test.describe("sensitive content", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockMintGarden(page);
    await mockDexieOffers(page);
  });

  test("a blocked NFT is veiled with its reason and reveals on click; a clear one is untouched", async ({
    page,
  }) => {
    // A real (if tiny) image so the blurred silhouette behind the glass actually renders.
    await page.route("**/thumbnails/*.webp", (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#3b7"/></svg>',
      })
    );
    await page.goto(`/nft/${BLOCKED_NFT_ID}`);
    const veil = page.getByRole("button", { name: /Sensitive content/i });
    await expect(veil).toBeVisible();
    await expect(page.getByText("Sensitive content").first()).toBeVisible();
    // The reason is a bare descriptor under a "Reason:" label, not MintGarden's raw wording,
    // so the headline's "content" is never repeated back.
    await expect(page.getByText(/Reason:\s*Pornographic$/).first()).toBeVisible();
    await expect(page.getByText(/Pornographic (material|content)/)).toHaveCount(0);
    // The artwork is drawn as it is and the glass over it does the obscuring, so the shapes
    // behind still read; it stays out of the a11y tree until the viewer asks for it.
    const behind = veil.locator("img");
    await expect(behind).toHaveAttribute("aria-hidden", "true");
    await expect(veil.locator("[class*=backdrop-blur]")).toBeVisible();
    await expect(page.getByRole("img", { name: "Blocked Friend #1" })).toHaveCount(0);

    await veil.click();
    await expect(veil).toBeHidden();
    await expect(page.getByRole("img", { name: "Blocked Friend #1" })).toBeVisible();

    // A clear NFT shows its artwork straight away, with no veil anywhere on the page.
    await page.goto(`/nft/${NFT_ID}`);
    await expect(page.getByRole("img", { name: "Test Friend #1" })).toBeVisible();
    await expect(page.getByText(/Sensitive content/)).toHaveCount(0);
  });

  test("a blocked collection is veiled in the collections table and the activity feed", async ({
    page,
  }) => {
    await page.goto("/nfts/collections");
    const table = page.getByRole("region", { name: "Collections" });
    await expect(table.getByText("Blocked Friends")).toBeVisible();
    // In a list the glass is decoration inside the item link, not its own control.
    await expect(table.locator('[title*="Sensitive content"]')).toHaveCount(1);
    // The clear collection in the same table keeps its thumbnail.
    await expect(table.getByText("Test Friends")).toBeVisible();

    await page.goto("/nfts/activity");
    await expect(page.locator('[title*="Sensitive content"]').first()).toBeVisible();
  });
});

test("the veil survives artwork that never loads", async ({ page }) => {
  await mockCoinset(page);
  await mockMintGarden(page);
  await mockDexieOffers(page);
  await page.route("**/thumbnails/*.webp", (route) => route.abort("failed"));
  await page.goto(`/nft/${BLOCKED_NFT_ID}`);
  // Losing the silhouette must not drop the reason or the reveal control.
  await expect(page.getByRole("button", { name: /Sensitive content/i })).toBeVisible();
  await expect(page.getByText(/Reason:\s*Pornographic$/).first()).toBeVisible();
});

test("a video NFT is veiled by its blocked creator and plays once revealed", async ({ page }) => {
  await mockCoinset(page);
  await mockMintGarden(page);
  await mockDexieOffers(page);
  let videoRequests = 0;
  await page.route(VIDEO_URL, (route) => {
    videoRequests++;
    return route.fulfill({ status: 200, contentType: "video/mp4", body: "" });
  });
  await page.route("**/thumbnails/*.webp", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#3b7"/></svg>',
    })
  );

  await page.goto(`/nft/${VIDEO_NFT_ID}`);
  const veil = page.getByRole("button", { name: /Sensitive content/i });
  await expect(veil).toBeVisible();
  // The still stands in behind the glass; the video itself is not fetched while veiled.
  await expect(page.getByText("Video", { exact: true })).toBeVisible();
  // The creator ban's policy wording is reduced to what it is actually about.
  await expect(page.getByText(/Reason:\s*Pornographic$/).first()).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  expect(videoRequests).toBe(0);

  await veil.click();
  const player = page.locator("video");
  await expect(player).toBeVisible();
  await expect(player).toHaveAttribute("controls", "");
  await expect(player).toHaveJSProperty("src", VIDEO_URL);
});
