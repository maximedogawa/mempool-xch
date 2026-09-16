import { expect, test } from "@playwright/test";
import { CUSTOM_NODE_URL, mockCustomNode } from "./mockCoinset";

/**
 * Custom full-node RPC parity (TASK-036): with an own node configured the dashboard still shows
 * state, recent blocks, projected blocks (mempool fetched in the browser) and fee cards, polls
 * instead of streaming, and never touches Coinset or the hosted APIs.
 */
test.describe("custom node", () => {
  test("dashboard works end to end against a custom node with polling", async ({ page }) => {
    await mockCustomNode(page);
    const hosted: string[] = [];
    const coinset: string[] = [];
    page.on("request", (r) => {
      const url = r.url();
      if (/\/api\/(mainnet|testnet11)\//.test(url)) hosted.push(url);
      if (/api\.coinset\.org/.test(url)) coinset.push(url);
    });
    await page.goto("/");
    await expect(page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("status").filter({ hasText: "Polling" }).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("status").filter({ hasText: "custom node" }).first()).toBeVisible();
    await expect(page.getByText(/custom node/).first()).toBeVisible();
    await page.waitForTimeout(1_000);
    expect(hosted, "hosted APIs must be skipped with a custom node").toEqual([]);
    expect(coinset, "Coinset must not be called with a custom node").toEqual([]);
  });

  test("settings name the endpoint and the polling channel", async ({ page }) => {
    await mockCustomNode(page);
    await page.goto("/settings");
    await expect(page.getByText("Live channel: Polling (custom node)")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(CUSTOM_NODE_URL).first()).toBeVisible();
  });
});
