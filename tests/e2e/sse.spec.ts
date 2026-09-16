import { expect, test } from "@playwright/test";
import { mockCoinset } from "./mockCoinset";

/**
 * Hosted live path (TASK-034): the browser subscribes to /api/<network>/events and reads
 * state, recent blocks and fees from /api/<network>/chain instead of calling Coinset itself.
 */
test.describe("server-sent events and chain cache", () => {
  test("dashboard goes live over SSE and reads chain data from the hosted cache", async ({ page }) => {
    await mockCoinset(page);
    const coinsetMethods: string[] = [];
    page.on("request", (r) => {
      const url = r.url();
      if (/api\.coinset\.org/.test(url)) coinsetMethods.push(new URL(url).pathname.slice(1));
    });
    await page.goto("/");
    await expect(page.getByRole("status").filter({ hasText: "Live" }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()).toBeVisible();
    await page.waitForTimeout(1_500);
    for (const method of ["get_blockchain_state", "get_block_records", "get_fee_estimate"]) {
      expect(coinsetMethods.filter((m) => m === method), `${method} should be served by the chain cache`).toHaveLength(0);
    }
  });

  test("a failing chain API falls back to the RPC with the same UI", async ({ page }) => {
    await mockCoinset(page);
    await page.route("**/api/mainnet/chain**", (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()).toBeVisible({ timeout: 15_000 });
  });
});
