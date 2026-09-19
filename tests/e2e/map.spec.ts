import { expect, test } from "@playwright/test";
import { mockCoinset, mockCustomNode } from "./mockCoinset";

test.describe("network map", () => {
  test("renders the dashboard snapshot without crawling seeders", async ({ page }) => {
    await mockCoinset(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network map" })).toBeVisible();
    await expect(page.getByRole("group", { name: /World map of 21,469 observed Chia nodes/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /United States: \d+ nodes/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /Germany: \d+ nodes/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset map view" })).toBeVisible();
    const countries = page.getByRole("table").first();
    await expect(countries.getByText("Germany")).toBeVisible();
    await expect(countries.getByText("United States")).toBeVisible();
    await expect(page.getByText("dashboard snapshot").first()).toBeVisible();
    await expect(page.getByText(/pulses model propagation/)).toBeVisible();

    await page.route("https://cloudflare-dns.com/**", (route) => route.abort());
    await page.route("https://dns.google/**", (route) => route.abort());
    await page.reload();
    await expect(page.getByRole("group", { name: /World map of 21,469 observed Chia nodes/ })).toBeVisible();
  });

  test("with a custom node also lists and places its connected peers", async ({ page }) => {
    await mockCustomNode(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network map" })).toBeVisible();
    const table = page.getByRole("region", { name: "Connections" });
    await expect(table.getByText("203.0.113.10:8444")).toBeVisible();
    await expect(table.getByText("Wallet")).toBeVisible();
    await expect(page.getByText("Full node", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Connected peer 203\.0\.113\.10 near Berlin, Germany/ })
    ).toBeVisible();
  });
});
