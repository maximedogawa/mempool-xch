import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mockCoinset, mockDexie, P2, TX_BLOCK_HEIGHT, TX_ID } from "./mockCoinset";
import { mockDexieOffers, mockMintGarden, NFT_ID } from "./mockMintGarden";
import { mockNodeScan } from "./mockNodeScan";

const ROUTES = ["/", "/blocks", "/pools", "/tokens", "/mempool", "/charts", "/fees", "/settings", "/docs", "/api", "/map", "/wallet", "/nfts", "/nfts/collections", "/nfts/activity", "/nfts/mints", `/nft/${NFT_ID}`, `/block/${TX_BLOCK_HEIGHT}`, `/tx/${TX_ID}`, `/address/${P2}`, "/legal/terms", "/legal/notice", "/legal/privacy", "/legal/cookies", "/learn", "/learn/what-is-the-mempool", "/learn/questions", "/prefarm", "/vaults", "/status", "/changelog", "/offer/e86a565172a26530728edf9712a34cfb103e1f1395710a6c181c495b4e2ccca5"];

test.describe("accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockDexie(page);
    await mockMintGarden(page);
    await mockDexieOffers(page);
    await mockNodeScan(page);
  });

  for (const route of ROUTES) {
    test(`axe passes on ${route}`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(1500);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const serious = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );
      expect(
        serious,
        serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join("\n")
      ).toEqual([]);
    });
  }

  test("no horizontal page scroll on a phone", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile project only");
    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForTimeout(1000);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `${route} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});
