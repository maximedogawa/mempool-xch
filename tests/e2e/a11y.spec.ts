import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mockCoinset, mockDexie, P2, TX_BLOCK_HEIGHT, TX_ID } from "./mockCoinset";
import { mockDexieOffers, mockMintGarden, NFT_ID } from "./mockMintGarden";
import { mockNodeScan } from "./mockNodeScan";

const ROUTES = [
  "/",
  "/blocks",
  "/pools",
  "/tokens",
  "/mempool",
  "/charts",
  "/fees",
  "/settings",
  "/docs",
  "/api",
  "/map",
  "/wallet",
  "/nfts",
  "/nfts/collections",
  "/nfts/activity",
  "/nfts/mints",
  `/nft/${NFT_ID}`,
  `/block/${TX_BLOCK_HEIGHT}`,
  `/tx/${TX_ID}`,
  `/address/${P2}`,
  "/legal/terms",
  "/legal/notice",
  "/legal/privacy",
  "/legal/cookies",
  "/learn",
  "/learn/what-is-the-mempool",
  "/learn/questions",
  "/prefarm",
  "/vaults",
  "/gaming",
  "/status",
  "/changelog",
  "/offer/e86a565172a26530728edf9712a34cfb103e1f1395710a6c181c495b4e2ccca5",
];

/**
 * Waits for the shell and for the route's data-backed panels to swap their skeletons for real
 * content, so axe reads the finished page. Capped: a panel whose mock never resolves must not
 * stall the sweep, and a route with no skeleton at all falls straight through.
 */
async function settled(page: Page) {
  await page.locator("#main").waitFor({ state: "visible" });
  await page
    .locator("#main .animate-pulse")
    .first()
    .waitFor({ state: "detached", timeout: 4_000 })
    .catch(() => {});
}

async function serious(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
}

function report(violations: Awaited<ReturnType<typeof serious>>) {
  return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`).join("\n");
}

test.describe("accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockDexie(page);
    await mockMintGarden(page);
    await mockDexieOffers(page);
    await mockNodeScan(page);
  });

  /*
   * The axe rules that matter here — labels, landmarks, heading order, contrast, roles — read
   * the markup, not the viewport, so sweeping every route twice only doubled the runtime. The
   * sweep runs on desktop; the two things that genuinely differ on a phone, the mobile-only nav
   * markup and horizontal overflow, get their own checks below.
   */
  for (const route of ROUTES) {
    test(`axe passes on ${route}`, async ({ page, isMobile }) => {
      test.skip(isMobile, "the route sweep runs once, on desktop");
      await page.goto(route);
      await settled(page);
      const violations = await serious(page);
      expect(violations, report(violations)).toEqual([]);
    });
  }

  test("axe passes on the phone's own navigation markup", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile project only");
    await page.goto("/");
    await settled(page);
    // The drawer only exists below lg, so it is never in the desktop sweep above.
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
    const violations = await serious(page);
    expect(violations, report(violations)).toEqual([]);
  });

  test("no horizontal page scroll on a phone", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile project only");
    for (const route of ROUTES) {
      await page.goto(route);
      await settled(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `${route} overflows by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });
});
