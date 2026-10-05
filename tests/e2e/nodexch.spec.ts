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
    expect(socket.host).toBe("api.nodexch.space");
    expect(socket.searchParams.get("key")).toBe(NODEXCH_KEY);
    expect(socket.searchParams.get("events")).toContain("peak");
    expect(seen.requests.length).toBeGreaterThan(0);
    for (const r of seen.requests) expect(r.authorization, r.url).toBe(`Bearer ${NODEXCH_KEY}`);
    expect(coinset, "Coinset must not be called with nodexch").toEqual([]);
  });

  test("tokens, prices and icons come from the gateway's Dexie paths, not from Dexie", async ({
    page,
  }) => {
    const seen = await mockNodexch(page);
    await page.goto("/tokens");
    await expect(page.getByText("Most Active Token").first()).toBeVisible({ timeout: 20_000 });
    const dexie = seen.requests.filter((r) => r.url.startsWith(`${NODEXCH_URL}/dexie/`));
    expect(dexie.some((r) => r.url.includes("/dexie/v1/assets?type=cat"))).toBe(true);
    expect(dexie.some((r) => r.url.endsWith("/dexie/v3/prices/tickers"))).toBe(true);
    for (const r of dexie) expect(r.authorization, r.url).toBe(`Bearer ${NODEXCH_KEY}`);
    await expect.poll(() => seen.icons.length, { timeout: 20_000 }).toBeGreaterThan(0);
    expect(seen.dexie, "Dexie must not be called with nodexch").toEqual([]);
  });

  test("the status page checks Dexie where it is asked: on the gateway", async ({ page }) => {
    await mockNodexch(page);
    await page.goto("/status");
    await expect(page.getByText("api.nodexch.space/dexie")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("status-dexie")).toHaveText("Operational", { timeout: 20_000 });
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
    await expect(page.getByText(/Live channel: Live stream/)).toBeVisible({
      timeout: 20_000,
    });
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

  test("the map draws the gateway's own count of the network", async ({ page }) => {
    await mockNodexch(page);
    await page.goto("/map");
    await expect(page.getByText(/Source: the crawler of api\.nodexch\.space/)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("IP geolocation by DB-IP (db-ip.com), CC BY 4.0")).toBeVisible();
    await expect(page.getByText("1,234").first()).toBeVisible();
  });

  test("when nodexch.space fails, nothing moves to Coinset or Dexie by itself; Coinset is picked in Settings", async ({
    page,
  }) => {
    const seen = await mockNodexch(page, { down: true });
    await page.goto("/tokens");
    await expect
      .poll(() => seen.requests.some((r) => r.url.includes("/dexie/")), { timeout: 20_000 })
      .toBe(true);
    await page.goto("/");
    await expect
      .poll(() => seen.requests.some((r) => r.url.endsWith("/get_blockchain_state")), {
        timeout: 20_000,
      })
      .toBe(true);
    await page.waitForTimeout(2_000);
    expect(seen.coinset, "Coinset is not asked behind a failing nodexch").toEqual([]);
    expect(seen.dexie, "Dexie is not asked behind a failing nodexch").toEqual([]);
    await expect(page.getByTestId("connection-fallback")).toHaveCount(0);

    // The way back to Coinset is the provider choice.
    await page.goto("/settings");
    await page
      .locator("fieldset")
      .first()
      .getByRole("radio", { name: /^Coinset/ })
      .check({ force: true });
    await page.getByRole("button", { name: /^Save/ }).first().click();
    // In-app navigation: a reload would run the mock's seed again and undo the choice.
    await page.getByRole("link", { name: "mempoolxch.space home" }).click();
    await expect(
      page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()
    ).toBeVisible({ timeout: 20_000 });
    expect(seen.coinset.length, "Coinset answers once it is chosen").toBeGreaterThan(0);
    for (const r of seen.coinset) expect(r.authorization, r.url).toBeNull();
  });
});

test.describe("provider choice", () => {
  test("with the key the server hands over at run time, a new visitor starts on nodexch.space", async ({
    page,
  }) => {
    const seen = await mockNodexch(page);
    // What the server answers with NODEXCH_KEY_MAINNET in its environment.
    await page.route("**/runtime-config.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `globalThis.__MEMPOOL_RUNTIME__=${JSON.stringify({ nodexchKeys: { mainnet: NODEXCH_KEY } })};`,
      })
    );
    await page.addInitScript(() => localStorage.removeItem("mempool-xch:settings:v1"));
    await page.goto("/");
    await expect
      .poll(() => seen.requests.some((r) => r.url.startsWith(NODEXCH_URL)), { timeout: 20_000 })
      .toBe(true);
    for (const r of seen.requests) expect(r.authorization, r.url).toBe(`Bearer ${NODEXCH_KEY}`);
    expect(seen.coinset, "Coinset must not be called with the site's key").toEqual([]);
    await page.goto("/settings");
    const mainnet = page.locator("fieldset").first();
    await expect(mainnet.getByRole("radio", { name: /^nodexch\.space/ })).toBeChecked();
    await expect(page.getByText("nodexch.space default")).toBeVisible();
    await expect(page.locator("#rpc-mainnet")).toHaveValue(NODEXCH_URL);
  });

  test("with a fallback named by the server, a failing main API is answered by it", async ({
    page,
  }) => {
    const seen = await mockNodexch(page, { down: true });
    // What the server answers with API_URL_MAINNET, API_FALLBACK_URL_MAINNET and the key set.
    await page.route("**/runtime-config.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `globalThis.__MEMPOOL_RUNTIME__=${JSON.stringify({
          nodexchKeys: { mainnet: NODEXCH_KEY },
          apiUrl: NODEXCH_URL,
          fallbackUrl: "https://api.coinset.org",
        })};`,
      })
    );
    await page.addInitScript(() => localStorage.removeItem("mempool-xch:settings:v1"));
    await page.goto("/");
    await expect(
      page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()
    ).toBeVisible({ timeout: 30_000 });
    expect(seen.requests.length, "the main API is asked first").toBeGreaterThan(0);
    expect(seen.coinset.length, "the fallback answers").toBeGreaterThan(0);
    for (const r of seen.coinset) expect(r.authorization, r.url).toBeNull();
  });

  test("a site without its key starts on Coinset; nodexch.space or an own node can be picked", async ({
    page,
  }) => {
    await mockNodexch(page);
    // A visitor with nothing stored, on a server without NODEXCH_KEY_MAINNET (this one): the
    // gateway refuses keyless requests, so the default is Coinset.
    await page.addInitScript(() => localStorage.removeItem("mempool-xch:settings:v1"));
    await page.goto("/settings");
    const mainnet = page.locator("fieldset").first();
    await expect(mainnet.getByRole("radio", { name: /^Coinset/ })).toBeChecked();
    await expect(page.getByText("Coinset default").first()).toBeVisible();
    await expect(page.locator("#rpc-mainnet")).toHaveValue("https://api.coinset.org");

    await mainnet.getByRole("radio", { name: /^nodexch\.space/ }).check({ force: true });
    await expect(page.locator("#rpc-mainnet")).toHaveValue(NODEXCH_URL);
    await mainnet.getByRole("radio", { name: /^Coinset/ }).check({ force: true });
    await expect(page.locator("#rpc-mainnet")).toHaveValue("https://api.coinset.org");
    await mainnet.getByRole("radio", { name: /^Own node/ }).check({ force: true });
    await expect(page.locator("#rpc-mainnet")).toHaveValue("");
    await expect(page.locator("#rpc-mainnet")).toHaveAttribute(
      "placeholder",
      "http://127.0.0.1:8556"
    );
  });
});
