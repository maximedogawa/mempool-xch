import { expect, test } from "@playwright/test";
import { mockCoinset, mockDexie } from "./mockCoinset";
import { mockMintGarden } from "./mockMintGarden";
import { mockNodeScan } from "./mockNodeScan";

test.describe("learn, prefarm, status and changelog", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockDexie(page);
    await mockMintGarden(page);
    await mockNodeScan(page);
  });

  test("learn index lists six articles and each article opens with previous/next links", async ({
    page,
  }) => {
    await page.goto("/learn");
    await expect(page.getByRole("heading", { level: 1, name: "Learn" })).toBeVisible();
    const list = page.getByRole("list").filter({ hasText: "What is Chia?" });
    await expect(list.getByRole("link")).toHaveCount(6);
    await page.getByRole("link", { name: /What is the mempool\?/ }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "What is the mempool?" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Offers and trading →" })).toBeVisible();
    await expect(page.getByRole("link", { name: "← Farming and plotting" })).toBeVisible();
    await page.goto("/learn/questions");
    await expect(page.getByRole("heading", { name: "What is the prefarm?" })).toBeVisible();
  });

  test("prefarm tracker reads the four vaults from chain", async ({ page }) => {
    await page.goto("/prefarm");
    await expect(page.getByRole("heading", { level: 1, name: "Prefarm tracker" })).toBeVisible();
    await expect(page.getByTestId("prefarm-cold-ch")).toHaveText("8,375,000 XCH");
    await expect(page.getByTestId("prefarm-warm-ch")).toHaveText("42,500 XCH");
    await expect(page.getByText("11,505,000 XCH")).toBeVisible();
    await expect(page.getByText(/54\.8% of the 21,000,000 XCH prefarm/)).toBeVisible();
    await expect(page.getByText("9,495,000 XCH")).toBeVisible();
    await expect(page.getByRole("link", { name: "prefarm-alert" })).toBeVisible();
  });

  test("status page checks every service from the browser", async ({ page }) => {
    await page.goto("/status");
    await expect(page.getByRole("heading", { level: 1, name: "Status" })).toBeVisible();
    await expect(page.getByTestId("status-coinset-full-node-rpc")).toHaveText("Operational");
    await expect(page.getByTestId("status-coinset-indexed-api")).toHaveText("Operational");
    await expect(page.getByTestId("status-dexie")).toHaveText("Operational");
    await expect(page.getByTestId("status-chia-dns-introducers")).toHaveText("Operational");
    await expect(page.getByTestId("status-geojs")).toHaveText("Operational");
    // MintGarden's collections endpoint is not mocked here: the check must fail closed, not hang.
    await expect(page.getByTestId("status-mintgarden")).not.toHaveText("Checking", {
      timeout: 15_000,
    });
    await expect(page.getByRole("button", { name: "Check again" })).toBeVisible();
  });

  test("changelog lists tagged releases newest first", async ({ page }) => {
    await page.goto("/changelog");
    await expect(page.getByRole("heading", { level: 1, name: "Changelog" })).toBeVisible();
    await expect(page.getByTestId("release-0.1.0")).toBeVisible();
    await expect(page.getByTestId("release-0.4.0")).toBeVisible();
    const headings = await page.getByRole("heading", { level: 2 }).allTextContents();
    const tagged = headings.filter((h) => /^v\d/.test(h));
    expect(tagged[tagged.length - 1]).toBe("v0.1.0");
    expect(tagged[0]).toBe("v0.4.0");
  });
});
