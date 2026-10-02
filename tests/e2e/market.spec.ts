import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Route } from "@playwright/test";
import dexieAsksByc from "../../src/test-utils/fixtures/marketDexieAsksByc.json";
import dexieAsksWusdcb from "../../src/test-utils/fixtures/marketDexieAsksWusdcb.json";
import dexieBidsByc from "../../src/test-utils/fixtures/marketDexieBidsByc.json";
import dexieBidsWusdcb from "../../src/test-utils/fixtures/marketDexieBidsWusdcb.json";
import gateBook from "../../src/test-utils/fixtures/marketGateBook.json";
import gateTrades from "../../src/test-utils/fixtures/marketGateTrades.json";
import htxBook from "../../src/test-utils/fixtures/marketHtxBook.json";
import htxTrades from "../../src/test-utils/fixtures/marketHtxTrades.json";
import okxBook from "../../src/test-utils/fixtures/marketOkxBook.json";
import okxBookUsdc from "../../src/test-utils/fixtures/marketOkxBookUsdc.json";
import okxTrades from "../../src/test-utils/fixtures/marketOkxTrades.json";
import { mockCoinset } from "./mockCoinset";

/*
 * Exchanges and Dexie answer with payloads recorded on 2026-09-23 (src/test-utils/fixtures).
 * Best bids: HTX 1.6362, OKX 1.631, Gate 1.63; best asks: Gate 1.631, OKX 1.635, HTX 1.6479.
 */

const WUSDCB = "fa4a180ac326e67ea289b869e3448256f6af05721f7cf934cb9901baa6b7a99d";

type Handler = (route: Route, call: number) => Promise<void>;

interface MarketMocks {
  gateBook?: Handler;
  gateTrades?: Handler;
  htxBook?: Handler;
}

const json = (body: unknown) => (route: Route) => route.fulfill({ json: body });

async function mockMarket(page: Page, overrides: MarketMocks = {}) {
  const calls = new Map<string, number>();
  const counted =
    (name: string, fallback: (route: Route) => Promise<void>, handler?: Handler) =>
    async (route: Route) => {
      const call = (calls.get(name) ?? 0) + 1;
      calls.set(name, call);
      await (handler ? handler(route, call) : fallback(route));
    };
  await page.route(
    "https://api.gateio.ws/api/v4/spot/order_book**",
    counted("gateBook", json(gateBook), overrides.gateBook)
  );
  await page.route(
    "https://api.gateio.ws/api/v4/spot/trades**",
    counted("gateTrades", json(gateTrades), overrides.gateTrades)
  );
  await page.route("https://www.okx.com/api/v5/market/books**", (route) =>
    route.fulfill({
      json:
        new URL(route.request().url()).searchParams.get("instId") === "XCH-USDC"
          ? okxBookUsdc
          : okxBook,
    })
  );
  await page.route("https://www.okx.com/api/v5/market/trades**", json(okxTrades));
  await page.route(
    "https://api.huobi.pro/market/depth**",
    counted("htxBook", json(htxBook), overrides.htxBook)
  );
  await page.route("https://api.huobi.pro/market/history/trade**", json(htxTrades));
  await page.route("https://api.dexie.space/v1/offers**", (route) => {
    const url = new URL(route.request().url());
    const asks = url.searchParams.get("offered") === "xch";
    const wusdcb = url.search.includes(WUSDCB);
    const body = wusdcb
      ? asks
        ? dexieAsksWusdcb
        : dexieBidsWusdcb
      : asks
        ? dexieAsksByc
        : dexieBidsByc;
    return route.fulfill({ json: body });
  });
}

test.describe("market", () => {
  test("shows the battlefield, per-exchange spreads, the cross best and Dexie", async ({
    page,
  }) => {
    await mockCoinset(page);
    await mockMarket(page);
    await page.goto("/market");
    await expect(page.getByRole("heading", { level: 1, name: "Market" })).toBeVisible();
    await expect(page.getByTestId("market-disclaimer")).toContainText("not financial");
    await expect(
      page.getByTestId("market-disclaimer").getByRole("link", { name: "terms of use" })
    ).toHaveAttribute("href", "/legal/terms");

    // Cross-exchange best bid and ask, with the exchange that holds them; the books are crossed.
    await expect(page.getByText("1.6362 USDT").first()).toBeVisible();
    await expect(page.getByText("on HTX")).toBeVisible();
    await expect(page.getByText("on Gate")).toBeVisible();
    await expect(page.getByText("−0.0052 USDT")).toBeVisible();

    // Every exchange is live with its own spread in absolute and percent.
    const gate = page.getByTestId("market-source-Gate");
    await expect(gate).toHaveAttribute("data-state", "live");
    await expect(gate.getByText("0.0010 USDT")).toBeVisible();
    await expect(gate.getByText("0.061%")).toBeVisible();
    await expect(page.getByTestId("market-source-OKX").getByText("0.0040 USDT")).toBeVisible();
    await expect(page.getByTestId("market-source-HTX").getByText("0.0117 USDT")).toBeVisible();

    // The battlefield: one depth line per exchange around the mid, the front-line gap, fills.
    const field = page.getByTestId("market-battlefield");
    await expect(field.locator("svg[role=img]")).toHaveAttribute(
      "aria-label",
      /best bid 1\.6362 USDT \(HTX\), best ask 1\.6310 USDT \(Gate\)/
    );
    for (const exchange of ["Gate", "OKX", "HTX"])
      await expect(field.getByTestId(`market-line-${exchange}`)).toHaveAttribute(
        "data-stale",
        "false"
      );
    await expect(field.getByTestId("market-gap")).toBeAttached();
    await expect(page.getByTestId("market-tape").locator("li").first()).toBeVisible();

    // Dexie: best offers recomputed from amounts; the DEX/CEX spread leads with the absolute.
    const dex = page.getByTestId("market-dex");
    await expect(dex.getByText("Dexie DEX · XCH / BYC")).toBeVisible();
    await expect(dex.getByText("1.7300 BYC")).toBeVisible();
    await expect(dex.getByText("1.8100 BYC")).toBeVisible();
    await expect(page.getByTestId("market-dex-cex")).toContainText("+0.1364 USDT");
    await expect(page.getByTestId("market-dex-cex")).toContainText("assumes both hold");
    await expect(dex.getByRole("link", { name: "Dexie pair" })).toHaveAttribute(
      "href",
      "https://dexie.space/offers/XCH/BYC"
    );

    // USDC: only OKX lists it, said plainly; wUSDC.b against USDC is like for like.
    await dex.getByRole("button", { name: "wUSDC.b" }).click();
    await expect(dex.getByText("Dexie DEX · XCH / wUSDC.b")).toBeVisible();
    await page.getByRole("button", { name: "USDC", exact: true }).click();
    await expect(page.getByTestId("market-unlisted")).toContainText(
      "Gate, HTX do not list XCH/USDC"
    );
    await expect(page.getByTestId("market-source-Gate")).toHaveCount(0);
    await expect(page.getByTestId("market-source-OKX")).toHaveAttribute("data-state", "live");
    await expect(page.getByText("1.6240 USDC").first()).toBeVisible();
    await expect(page.getByTestId("market-dex-cex")).toContainText("is a wrapped USDC");
  });

  test("a new fill lands as a hit on the side it took", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await mockCoinset(page);
    // The first poll seeds the tape (history, no hits); the next one brings the newest trade,
    // a taker sell, which hits the bids.
    await mockMarket(page, {
      gateTrades: (route, call) =>
        route.fulfill({ json: call === 1 ? gateTrades.slice(1) : gateTrades }),
    });
    await page.goto("/market");
    const field = page.getByTestId("market-battlefield");
    await expect(field).toHaveAttribute("data-reduced", "false");
    await expect(field.getByTestId("market-hit").first()).toBeAttached({ timeout: 20_000 });
    await expect(field.getByTestId("market-hit").first()).toHaveAttribute("data-side", "bids");
  });

  test("keeps a failing exchange's last book greyed and stale, out of the aggregate", async ({
    page,
  }) => {
    await mockCoinset(page);
    await mockMarket(page, {
      htxBook: (route, call) =>
        call === 1
          ? route.fulfill({ json: htxBook })
          : route.fulfill({ status: 503, body: "busy" }),
    });
    await page.goto("/market");
    const htx = page.getByTestId("market-source-HTX");
    await expect(htx).toHaveAttribute("data-state", "live");
    await expect(page.getByText("on HTX")).toBeVisible();

    await expect(htx).toHaveAttribute("data-state", "stale", { timeout: 20_000 });
    await expect(htx.getByText("STALE")).toBeVisible();
    await expect(htx.getByText(/last update \d/)).toBeVisible();
    await expect(htx.getByRole("status")).toContainText("HTTP 503");
    // The last book stays on the card …
    await expect(htx.getByText("1.6362 USDT")).toBeVisible();
    // … but the aggregate moved on: the best bid is now OKX's.
    await expect(page.getByText("on OKX")).toBeVisible();
    await expect(
      page.getByTestId("market-battlefield").getByTestId("market-line-HTX")
    ).toHaveAttribute("data-stale", "true");
    await expect(page.getByText("2/3")).toBeVisible();
  });

  test("an exchange that never answers is shown unavailable and the page still works", async ({
    page,
  }) => {
    await mockCoinset(page);
    await mockMarket(page, { gateBook: (route) => route.abort("failed") });
    await page.goto("/market");
    const gate = page.getByTestId("market-source-Gate");
    await expect(gate.getByText("Source unavailable")).toBeVisible();
    await expect(gate).toHaveAttribute("data-state", "stale");
    await expect(page.getByTestId("market-source-OKX")).toHaveAttribute("data-state", "live");
    await expect(page.getByText("on OKX").first()).toBeVisible();
  });

  test("honours prefers-reduced-motion with a static chart and keeps the toggle", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await mockCoinset(page);
    await mockMarket(page);
    await page.goto("/market");
    const field = page.getByTestId("market-battlefield");
    await expect(field).toHaveAttribute("data-reduced", "true");
    const toggle = page.getByRole("button", { name: "Reduce motion" });
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect(field).toHaveAttribute("data-reduced", "false");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  test("has no serious accessibility violations", async ({ page }) => {
    await mockCoinset(page);
    await mockMarket(page);
    await page.goto("/market");
    await expect(page.getByTestId("market-source-Gate")).toHaveAttribute("data-state", "live");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
  });
});
