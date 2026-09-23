import { expect, test, type Page } from "@playwright/test";
import shipped from "../../src/shared/lib/map/dashboardSnapshot.json";
import type { DashboardSnapshot } from "../../src/shared/lib/map/dashboard";
import { countryRows, regionRows } from "../../src/shared/lib/map/stats";
import { mockCoinset, mockCustomNode } from "./mockCoinset";
import { mockNodeScan, SEED_NODES } from "./mockNodeScan";

/** Expectations follow the shipped snapshot, so refreshing it (bun run map:dashboard) keeps these green. */
const SNAPSHOT = shipped as DashboardSnapshot;
const ROWS = countryRows(SNAPSHOT);
const PLACED = ROWS.reduce((sum, row) => sum + row.nodes, 0);
const n = (value: number) => value.toLocaleString("en-US");
const row = (label: string) => ROWS.find((item) => item.label === label)!;
const OBSERVED = Date.parse(SNAPSHOT.observedAt);
const DAY = 86_400_000;

/** Pins the browser clock: a day after the capture the snapshot is fresh, 40 days after stale. */
async function at(page: Page, time: number) {
  await page.clock.install({ time });
}

/** Records every request to the seeder-scan hosts (DNS-over-HTTPS and GeoJS). */
function scanRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/cloudflare-dns\.com|dns\.google|get\.geojs\.io/.test(url)) urls.push(url);
  });
  return urls;
}

test.describe("network map", () => {
  test("renders the dashboard snapshot without crawling seeders", async ({ page, isMobile }) => {
    await at(page, OBSERVED + DAY);
    await mockCoinset(page);
    const scans = scanRequests(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network map" })).toBeVisible();
    await expect(
      page.getByRole("group", {
        name: `World map of ${n(PLACED)} observed Chia nodes in ${ROWS.length} countries`,
      })
    ).toBeVisible();
    const us = row("United States");
    const de = row("Germany");
    await expect(
      page.getByRole("button", { name: `United States: ${n(us.nodes)} nodes, rank ${us.rank}` })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: `Germany: ${n(de.nodes)} nodes, rank ${de.rank}` })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset map view" })).toBeVisible();

    // Every dashboard panel the snapshot carries is on the page.
    await expect(
      page.getByText(SNAPSHOT.versions[0]!.label, { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText(/nodes report a version/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Europe/ }).first()).toBeVisible();
    await expect(page.getByText("IPv6", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/Reliable/).first()).toBeVisible();

    const countries = page.getByRole("region", { name: "Countries" });
    await expect(countries.getByText("Germany")).toBeVisible();
    await expect(countries.getByText("United States")).toBeVisible();
    // The region column is a wide-screen extra; the map's own colours carry it on a phone.
    if (!isMobile) await expect(countries.getByText("North America").first()).toBeVisible();
    await expect(page.getByText(/pulses model propagation|a model of\s+propagation/)).toBeVisible();
    await expect(page.getByText(/are a model: they land on countries/)).toBeVisible();

    // Statistics over time and the operator table.
    await expect(page.getByText("Network over time")).toBeVisible();
    await expect(page.locator('svg[aria-label^="Full nodes over time. "]')).toBeVisible();
    await page.getByRole("button", { name: "IPv6", exact: true }).click();
    await expect(page.locator('svg[aria-label^="IPv6 over time. "]')).toBeVisible();
    await expect(page.getByText("Versions over time")).toBeVisible();
    const operators = page.getByRole("region", { name: "Network operators" });
    await expect(operators.getByText(SNAPSHOT.asns!.top[0]!.organization)).toBeVisible();

    // Attribution and no fallback note.
    await expect(page.getByText(/Node statistics by Chia Network Inc\./)).toBeVisible();
    await expect(page.getByText(/The dashboard snapshot (is|covers)/)).toHaveCount(0);
    expect(scans).toEqual([]);
  });

  test("searching filters the map and selecting a country shows its detail", async ({ page }) => {
    await at(page, OBSERVED + DAY);
    await mockCoinset(page);
    await page.goto("/map");
    const search = page.getByRole("textbox", { name: "Filter the map by country or region" });
    // On a slow runner the field is typed into before hydration, which then resets the
    // controlled value to "": type again until the filter has taken hold.
    await expect(async () => {
      await search.fill("germany");
      await expect(page.getByText(`1 of ${ROWS.length} countries`)).toBeVisible({
        timeout: 1_000,
      });
    }).toPass({ timeout: 15_000 });
    const countries = page.getByRole("region", { name: "Countries" });
    await expect(countries.getByText("Germany")).toBeVisible();
    await expect(countries.getByText("United States")).toHaveCount(0);

    // Unmatched markers go inert; the matched one is still selectable.
    const de = row("Germany");
    const us = page.getByRole("button", { name: /United States: [\d,]+ nodes/ });
    await expect(us).toHaveAttribute("tabindex", "-1");
    await page.getByRole("button", { name: /Germany: [\d,]+ nodes/ }).click();
    const detail = page.getByRole("status").filter({ hasText: "Germany" });
    await expect(detail).toContainText(n(de.nodes));
    await expect(detail).toContainText(`#${de.rank}`);
    await expect(detail).toContainText("Europe");

    await page.getByRole("button", { name: "Reset map view" }).click();
    await expect(
      page.getByText(`${n(SNAPSHOT.total)} full nodes · ${ROWS.length} countries`)
    ).toBeVisible();
  });

  test("a region chip filters the map to that region", async ({ page }) => {
    await at(page, OBSERVED + DAY);
    await mockCoinset(page);
    await page.goto("/map");
    const oceania = regionRows(ROWS).find((region) => region.region === "Oceania")!;
    await page
      .getByRole("button", { name: /^Oceania/ })
      .first()
      .click();
    await expect(page.getByText(`${oceania.countries} of ${ROWS.length} countries`)).toBeVisible();
    const countries = page.getByRole("region", { name: "Countries" });
    await expect(countries.getByText("Australia")).toBeVisible();
    await expect(countries.getByText("Germany")).toHaveCount(0);
  });

  test("a first visit grows every country in", async ({ page }) => {
    await at(page, OBSERVED + DAY);
    await mockCoinset(page);
    await page.goto("/map");
    await expect
      .poll(() => page.locator(".map-node-enter").count())
      .toBeGreaterThan(ROWS.length / 2);
  });

  test("a newer snapshot grows in new countries and rings changed ones", async ({ page }) => {
    await at(page, OBSERVED + DAY);
    await mockCoinset(page);
    // A visitor who last saw an older snapshot in which Germany had one node less and Austria
    // was missing.
    const counts = Object.fromEntries(ROWS.map((item) => [item.key, item.nodes]));
    counts.Germany = row("Germany").nodes - 1;
    delete counts.Austria;
    await page.addInitScript(
      ([key, value]) => {
        if (!sessionStorage.getItem("seeded")) {
          localStorage.setItem(key, value);
          sessionStorage.setItem("seeded", "1");
        }
      },
      [
        "mempool-xch:map:seen:v1:mainnet",
        JSON.stringify({ version: 1, id: "2026-01-01T00:00:00.000Z", counts }),
      ] as const
    );
    await page.goto("/map");
    const germany = page.getByRole("button", { name: /Germany: [\d,]+ nodes/ });
    await expect(germany.locator(".map-node-ring")).toHaveCount(1);
    await expect(page.getByRole("button", { name: /Austria: [\d,]+ nodes/ })).toHaveClass(
      /map-node-enter/
    );
    await expect(page.locator(".map-node-enter")).toHaveCount(1);

    // The same snapshot again plays nothing.
    await page.reload();
    await expect(page.getByRole("button", { name: /Germany: [\d,]+ nodes/ })).toBeVisible();
    await expect(page.locator(".map-node-enter, .map-node-ring")).toHaveCount(0);
  });

  test("animations pause while the tab is hidden and reduced motion is static", async ({
    page,
  }) => {
    await at(page, OBSERVED + DAY);
    await mockCoinset(page);
    await page.goto("/map");
    const viewport = page.locator(".map-viewport");
    const arc = page.locator(".map-arc").first();
    await expect(arc).toBeAttached();
    // Off screen (a phone's first screen is the stat tiles) the map is paused as well.
    await viewport.scrollIntoViewIfNeeded();
    await expect(viewport).not.toHaveAttribute("data-paused", "true");
    expect(await arc.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("running");

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(viewport).toHaveAttribute("data-paused", "true");
    expect(await arc.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(page.locator(".map-arc").first()).toBeAttached();
    expect(
      await page
        .locator(".map-arc")
        .first()
        .evaluate((el) => getComputedStyle(el).animationName)
    ).toBe("none");
    await expect(page.locator(".map-node-enter")).toHaveCount(0);
  });

  test("falls back to the seeder scan with a note when the snapshot is stale", async ({ page }) => {
    await at(page, OBSERVED + 40 * DAY);
    await mockCoinset(page);
    await mockNodeScan(page);
    const scans = scanRequests(page);
    await page.goto("/map");
    const note = page.getByRole("note").filter({ hasText: "The dashboard snapshot is from" });
    await expect(note).toContainText(/more than 30 days ago/);
    await expect(note).toContainText(/live seeder scan/);
    await expect(page.getByRole("button", { name: "Germany: 2 nodes, rank 1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "United States: 1 node, rank 2" })).toBeVisible();
    await expect(page.getByText("Seeder scan", { exact: true })).toBeVisible();
    await expect(page.getByText(/this browser's seeder scan/)).toBeVisible();
    // The dashboard-only panels are not mixed into the scan.
    await expect(page.getByText("Network over time")).toHaveCount(0);

    // Only node addresses from the seeder answers are ever sent to GeoJS.
    const known = new Set<string>(Object.values(SEED_NODES));
    const geo = scans.filter((url) => url.includes("get.geojs.io"));
    expect(geo.length).toBeGreaterThan(0);
    for (const url of geo) {
      const ips = new URL(url).searchParams.get("ip")!.split(",");
      for (const ip of ips) expect(known.has(ip)).toBe(true);
    }
  });

  test("with a custom node also lists and places its connected peers", async ({
    page,
    isMobile,
  }) => {
    await at(page, OBSERVED + DAY);
    await mockCustomNode(page);
    await mockNodeScan(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network map" })).toBeVisible();
    const table = page.getByRole("region", { name: "Connections" });
    await expect(table.getByText("203.0.113.10:8444")).toBeVisible();
    await expect(table.getByText("Wallet")).toBeVisible();
    if (!isMobile) {
      // The location and operator columns only appear from the lg breakpoint up.
      await expect(table.getByText("Berlin, Germany")).toBeVisible();
      await expect(table.getByText("Example Telekom")).toBeVisible();
    }
    await expect(page.getByText("Full node", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Connected peer 203\.0\.113\.10 near Berlin, Germany/ })
    ).toBeVisible();
  });
});
