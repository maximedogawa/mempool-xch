import { expect, test } from "@playwright/test";
import { mockNodexch, NODEXCH_KEY, NODEXCH_URL, TX_ID } from "./mockCoinset";

/**
 * nodexch as the provider (nodexch TASK-006): it behaves like Coinset for RPC, the indexed API
 * and events, on its own host, with the site's publishable key on every call and in the socket
 * URL; nothing goes to Coinset.
 */
test.describe("nodexch provider", () => {
  test("the dashboard runs on nodexch with live events and the key", async ({ page }) => {
    const seen = await mockNodexch(page);
    const coinset: string[] = [];
    page.on("request", (r) => {
      if (/coinset\.org/.test(r.url())) coinset.push(r.url());
    });
    await page.goto("/");
    await expect(
      page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("status").filter({ hasText: "Live" }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect.poll(() => seen.sockets.length, { timeout: 20_000 }).toBeGreaterThan(0);
    const socket = new URL(seen.sockets[0]!);
    expect(socket.host).toBe("nodexch.space");
    expect(socket.searchParams.get("key")).toBe(NODEXCH_KEY);
    expect(socket.searchParams.get("events")).toContain("peak");
    expect(seen.requests.length).toBeGreaterThan(0);
    for (const r of seen.requests) expect(r.authorization, r.url).toBe(`Bearer ${NODEXCH_KEY}`);
    expect(coinset, "Coinset must not be called with nodexch").toEqual([]);
  });

  test("indexed pages read nodexch's indexed API", async ({ page }) => {
    const seen = await mockNodexch(page);
    await page.goto(`/tx/${TX_ID}`);
    await expect
      .poll(() => seen.requests.some((r) => r.url.endsWith("/get_transaction")), {
        timeout: 20_000,
      })
      .toBe(true);
  });

  test("settings name nodexch and its socket", async ({ page }) => {
    await mockNodexch(page);
    await page.goto("/settings");
    await expect(page.getByText(/Live channel: nodexch socket/)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(NODEXCH_URL).first()).toBeVisible();
  });

  test("the map shows the node's peers from the node channel", async ({ page }) => {
    const seen = await mockNodexch(page);
    await page.goto("/map");
    await expect
      .poll(() => seen.requests.some((r) => r.url.endsWith("/x/node/v1/peers")), {
        timeout: 20_000,
      })
      .toBe(true);
  });
});
