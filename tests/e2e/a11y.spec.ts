import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mockCoinset, mockDexie, P2, TX_BLOCK_HEIGHT, TX_ID } from "./mockCoinset";
import { mockDexieOffers, mockMintGarden, NFT_ID } from "./mockMintGarden";
import { HANDLE, mockXchandles } from "./mockXchandles";
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
  `/handle/${HANDLE}`,
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
    await mockXchandles(page);
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

  // The same sweep in the light theme, which the dark default above never reached: light-only
  // hues had drifted below AA unnoticed (TASK-095). The setting is stored before the app boots.
  for (const route of ROUTES) {
    test(`axe passes on ${route} (light)`, async ({ page, isMobile }) => {
      test.skip(isMobile, "the route sweep runs once, on desktop");
      await page.addInitScript(() => {
        try {
          const key = "mempool-xch:settings:v1";
          const stored = JSON.parse(localStorage.getItem(key) ?? "{}");
          localStorage.setItem(key, JSON.stringify({ ...stored, theme: "light" }));
        } catch {
          // Storage unavailable: the check below fails loudly on the theme instead.
        }
      });
      await page.goto(route);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await settled(page);
      const violations = await serious(page);
      expect(violations, report(violations)).toEqual([]);
    });
  }

  test("live-feed rows keep AA contrast at the peak of their fresh-row flash", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "markup check, runs once on desktop");
    // A row only carries the flash for 1.6s after it arrives, which made the sweep on / flaky
    // (TASK-095). Freeze every feed row at the flash's first frame and check it in both themes.
    await page.goto("/");
    await settled(page);
    const rows = page.locator('ul[aria-relevant="additions"] > li');
    await expect(rows.first()).toBeVisible();
    await page.addStyleTag({
      content:
        'ul[aria-relevant="additions"] > li { animation: row-in 1s linear 0s paused both !important; }',
    });
    for (const theme of ["dark", "light"]) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      const results = await new AxeBuilder({ page })
        .include('ul[aria-relevant="additions"]')
        .withRules(["color-contrast"])
        .analyze();
      expect(results.violations, `${theme}: ${report(results.violations)}`).toEqual([]);
    }
  });

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
