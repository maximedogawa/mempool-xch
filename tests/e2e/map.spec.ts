import { expect, test } from "@playwright/test";
import { mockCoinset, mockCustomNode } from "./mockCoinset";
import { mockNodeScan } from "./mockNodeScan";

test.describe("network map", () => {
  test("renders the dashboard snapshot without crawling seeders", async ({ page, isMobile }) => {
    await mockCoinset(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network map" })).toBeVisible();
    await expect(
      page.getByRole("group", { name: /World map of 21,427 observed Chia nodes in 113 countries/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /United States: 3,468 nodes, rank 1/ })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Germany: 2,121 nodes, rank 3/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset map view" })).toBeVisible();

    // Every dashboard panel the snapshot carries is on the page.
    await expect(page.getByText("2.7.4", { exact: true })).toBeVisible();
    await expect(page.getByText(/nodes report a version/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Europe/ }).first()).toBeVisible();
    await expect(page.getByText("IPv6", { exact: true })).toBeVisible();
    await expect(page.getByText(/Reliable/).first()).toBeVisible();

    const countries = page.getByRole("region", { name: "Countries" });
    await expect(countries.getByText("Germany")).toBeVisible();
    await expect(countries.getByText("United States")).toBeVisible();
    // The region column is a wide-screen extra; the map's own colours carry it on a phone.
    if (!isMobile) await expect(countries.getByText("North America").first()).toBeVisible();
    await expect(page.getByText(/pulses model propagation|a model of\s+propagation/)).toBeVisible();

    await page.route("https://cloudflare-dns.com/**", (route) => route.abort());
    await page.route("https://dns.google/**", (route) => route.abort());
    await page.reload();
    await expect(
      page.getByRole("group", { name: /World map of 21,427 observed Chia nodes/ })
    ).toBeVisible();
  });

  test("searching filters the map and selecting a country shows its detail", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/map");
    const search = page.getByRole("textbox", { name: "Filter the map by country or region" });
    // On a slow runner the field is typed into before hydration, which then resets the
    // controlled value to "": type again until the filter has taken hold.
    await expect(async () => {
      await search.fill("germany");
      await expect(page.getByText(/1 of 113 countries/)).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    const countries = page.getByRole("region", { name: "Countries" });
    await expect(countries.getByText("Germany")).toBeVisible();
    await expect(countries.getByText("United States")).toHaveCount(0);

    // Unmatched markers go inert; the matched one is still selectable.
    const us = page.getByRole("button", { name: /United States: 3,468 nodes/ });
    await expect(us).toHaveAttribute("tabindex", "-1");
    await page.getByRole("button", { name: /Germany: 2,121 nodes/ }).click();
    const detail = page.getByRole("status").filter({ hasText: "Germany" });
    await expect(detail).toContainText("2,121");
    await expect(detail).toContainText("#3");
    await expect(detail).toContainText("Europe");

    await page.getByRole("button", { name: "Reset map view" }).click();
    await expect(page.getByText(/21,469 full nodes · 113 countries/)).toBeVisible();
  });

  test("a region chip filters the map to that region", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/map");
    await page
      .getByRole("button", { name: /^Oceania/ })
      .first()
      .click();
    await expect(page.getByText(/3 of 113 countries/)).toBeVisible();
    const countries = page.getByRole("region", { name: "Countries" });
    await expect(countries.getByText("Australia")).toBeVisible();
    await expect(countries.getByText("Germany")).toHaveCount(0);
  });

  test("with a custom node also lists and places its connected peers", async ({
    page,
    isMobile,
  }) => {
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
