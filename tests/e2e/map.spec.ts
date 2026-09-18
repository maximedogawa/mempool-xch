import { expect, test } from "@playwright/test";
import { mockCoinset, mockCustomNode } from "./mockCoinset";
import { mockNodeScan } from "./mockNodeScan";

test.describe("network map", () => {
  test("scans the seeders, places nodes on the map and lists countries", async ({ page }) => {
    await mockCoinset(page);
    await mockNodeScan(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network" })).toBeVisible();

    // First seeder answer: four IPv4 nodes, three of them placeable (two Berlin, one San Francisco).
    const map = page.getByRole("group", { name: /World map of \d+ observed Chia nodes/ });
    await expect(map).toBeVisible();
    await expect(page.getByRole("img", { name: "Berlin, Germany: 2 nodes" })).toBeVisible();
    await expect(
      page.getByRole("img", { name: "San Francisco, United States: 1 node" })
    ).toBeVisible();

    const countries = page.getByRole("table").first();
    await expect(countries.getByText("Germany")).toBeVisible();
    await expect(countries.getByText("United States")).toBeVisible();
    await expect(countries.getByRole("cell", { name: "2" })).toBeVisible();

    // Hovering a marker names the place and the count.
    await page.getByRole("img", { name: "Berlin, Germany: 2 nodes" }).hover();
    await expect(page.getByRole("status").filter({ hasText: "Berlin, Germany" })).toBeVisible();
    await expect(page.getByText("Example Telekom")).toBeVisible();

    // Attribution and the honesty note about propagation pulses.
    await expect(page.getByRole("link", { name: "GeoJS" })).toBeVisible();
    await expect(page.getByText(/pulses model propagation/)).toBeVisible();
  });

  test("keeps the observed nodes across reloads", async ({ page }) => {
    await mockCoinset(page);
    await mockNodeScan(page);
    await page.goto("/map");
    await expect(page.getByRole("img", { name: "Berlin, Germany: 2 nodes" })).toBeVisible();
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("mempool-xch:nodes:v1:mainnet")
    );
    expect(stored).toContain("203.0.113.10");

    // Seeders unreachable on the next visit: the map still shows what was learnt before.
    await page.unroute("https://cloudflare-dns.com/dns-query**");
    await page.unroute("https://dns.google/resolve**");
    await page.route("https://cloudflare-dns.com/dns-query**", (route) => route.abort());
    await page.route("https://dns.google/resolve**", (route) => route.abort());
    await page.reload();
    await expect(page.getByRole("img", { name: "Berlin, Germany: 2 nodes" })).toBeVisible();
  });

  test("with a custom node also lists and places its connected peers", async ({ page }) => {
    await mockCustomNode(page);
    await mockNodeScan(page);
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1, name: "Network" })).toBeVisible();
    const table = page.getByRole("region", { name: "Connections" });
    await expect(table.getByText("203.0.113.10:8444")).toBeVisible();
    await expect(table.getByText("Wallet")).toBeVisible();
    await expect(page.getByText("Full node", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("img", { name: /Connected peer 203\.0\.113\.10 near Berlin, Germany/ })
    ).toBeVisible();
  });
});
