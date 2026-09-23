import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { fakeCatHistoryTx, installFakeSage } from "./fakeSage";
import { mockCoinset, mockDexie, P2, TOKEN_ACTIVE, TOKEN_QUIET } from "./mockCoinset";

const UNPRICED = "44".repeat(32);
const XCH = 10n ** 12n;

/** A watched address holding 10 XCH, 1,000 MAT (12.5 XCH), 2 QT (7 XCH) and an unpriced CAT. */
async function watchAddress(page: Page) {
  await page.addInitScript((id) => {
    localStorage.setItem(
      "mempool-xch:watchlist:v1",
      JSON.stringify([{ kind: "address", id, label: "xch1demo", addedAt: 1 }])
    );
  }, P2);
  await page.route(/api\.coinset\.org\/get_xch_balance_by_p2/, (route) =>
    route.fulfill({
      json: {
        p2: `0x${P2}`,
        confirmed_balance: String(10n * XCH),
        locked_balance: "0",
        pending_balance: "0",
        pending_locked_balance: "0",
        success: true,
      },
    })
  );
  const cat = (assetId: string, mojos: string) => ({
    cat_asset_id: `0x${assetId}`,
    confirmed_balance: mojos,
    locked_balance: "0",
    pending_balance: "0",
  });
  await page.route(/api\.coinset\.org\/get_cat_balances_by_p2/, (route) =>
    route.fulfill({
      json: {
        p2: `0x${P2}`,
        balances: [cat(TOKEN_ACTIVE, "1000000"), cat(TOKEN_QUIET, "2000"), cat(UNPRICED, "5000")],
        success: true,
      },
    })
  );
}

/** Inside Sage: 4 XCH and 800 MAT (10 XCH), MAT known from the wallet's history. */
async function sageWallet(page: Page) {
  await installFakeSage(
    page,
    [],
    undefined,
    undefined,
    [fakeCatHistoryTx("ab".repeat(32), TOKEN_ACTIVE, 800_000, { name: "MAT", ticker: "MAT" })],
    { xch: String(4n * XCH), [TOKEN_ACTIVE]: "800000" }
  );
}

test.describe("portfolio", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockDexie(page);
  });

  test("explains where holdings come from when there is no source", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.getByRole("heading", { level: 1, name: "Portfolio" })).toBeVisible();
    await expect(page.getByText("Nothing to show yet")).toBeVisible();
  });

  test("values a watched address in USD with its allocation and holdings", async ({ page }) => {
    await watchAddress(page);
    await page.goto("/portfolio");

    // 29.5 XCH at $2, up 5 % over 24 hours: $59.00, of which $2.81 came from XCH's move.
    await expect(page.getByText("$59.00").first()).toBeVisible();
    await expect(page.getByText("≈ 29.5 XCH")).toBeVisible();
    await expect(page.getByText("+5.00% · +$2.81")).toBeVisible();

    const holdings = page.getByRole("region", { name: "Holdings" }).locator("tbody tr");
    await expect(holdings).toHaveCount(4);
    await expect(holdings.nth(0)).toContainText("Most Active Token");
    await expect(holdings.nth(0)).toContainText("42.4%");
    await expect(holdings.nth(1)).toContainText("Chia");
    await expect(holdings.nth(2)).toContainText("Quiet Token");
    // Unpriced: listed with its amount, valued as unknown and left out of the chart.
    await expect(holdings.nth(3)).toContainText("5");
    await expect(holdings.nth(3)).toContainText("—");

    const chart = page.getByRole("img", { name: /Allocation of the portfolio value/ });
    await expect(chart).toHaveAttribute("aria-label", /Most Active Token 42\.4%/);
    const legend = page.getByRole("button", { name: /Quiet Token/ });
    await legend.hover();
    await expect(page.getByText("$14.00 · 23.7%").first()).toBeVisible();

    await expect(page.getByText("Without a price")).toBeVisible();
    // The table scrolls inside its card; the page itself never scrolls sideways on a phone.
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth
      )
    ).toBe(true);
  });

  test("inside Sage shows the wallet, and combines it with watched addresses", async ({ page }) => {
    await sageWallet(page);
    await watchAddress(page);
    await page.goto("/portfolio");
    const sources = page.getByRole("radiogroup", { name: "Source" });
    await expect(sources.getByRole("radio")).toHaveCount(3);

    // Everything: 14 XCH, 1,800 MAT (22.5 XCH) and 2 QT (7 XCH) = 43.5 XCH = $87.00.
    await expect(page.getByText("$87.00").first()).toBeVisible();

    await sources.getByRole("radio", { name: "Sage wallet" }).click();
    await expect(page.getByText("$28.00").first()).toBeVisible();
    const holdings = page.getByRole("region", { name: "Holdings" }).locator("tbody tr");
    await expect(holdings).toHaveCount(2);
    await expect(holdings.nth(0)).toContainText("Most Active Token");
  });

  test("the wallet page links to the portfolio", async ({ page }) => {
    await sageWallet(page);
    await page.goto("/wallet");
    await page.getByRole("main").getByRole("link", { name: "Portfolio" }).click();
    await expect(page).toHaveURL(/\/portfolio/);
    await expect(page.getByText("$28.00").first()).toBeVisible();
  });

  test("the address page embeds the portfolio", async ({ page }) => {
    await watchAddress(page);
    await page.goto(`/address/${P2}`);
    await expect(page.getByRole("heading", { level: 2, name: "Portfolio" })).toBeVisible();
    await expect(page.getByText("$59.00").first()).toBeVisible();
  });

  test("passes axe in both themes", async ({ page }) => {
    await watchAddress(page);
    await page.goto("/portfolio");
    await expect(page.getByText("$59.00").first()).toBeVisible();
    // Colours transition on a theme switch; axe must see the settled colours, not a midpoint.
    await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
    for (const theme of ["dark", "light"]) {
      await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(
        results.violations.map((v) => `${theme} ${v.id}: ${v.help} (${v.nodes.length})`)
      ).toEqual([]);
    }
  });
});
