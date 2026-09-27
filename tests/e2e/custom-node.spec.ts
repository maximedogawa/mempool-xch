import { expect, test } from "@playwright/test";
import blockchainState from "../../src/test-utils/fixtures/blockchain_state.json";
import { CUSTOM_NODE_URL, mockCustomNode, TX_BLOCK_HEIGHT } from "./mockCoinset";

/**
 * Custom full-node RPC parity: with an own node configured the dashboard still shows
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
    await expect(
      page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()
    ).toBeVisible({ timeout: 20_000 });
    // Polling is not called out on the pill any more: it reads Live, and only the channel
    // description below names the transport.
    await expect(page.getByRole("status").filter({ hasText: "Live" }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("status").filter({ hasText: "custom node" }).first()).toBeVisible();
    await expect(page.getByText(/custom node/).first()).toBeVisible();
    await page.waitForTimeout(1_000);
    expect(hosted, "hosted APIs must be skipped with a custom node").toEqual([]);
    expect(coinset, "Coinset must not be called with a custom node").toEqual([]);
  });

  test("settings name the endpoint and the polling channel", async ({ page }) => {
    await mockCustomNode(page);
    await page.goto("/settings");
    await expect(page.getByText("Live channel: Polling (custom node)")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(CUSTOM_NODE_URL).first()).toBeVisible();
  });

  // Found against a real node (TASK-109): a detail page opened directly (not reached by a click)
  // mounts while the stored settings are still being read, its first call is refused, and it
  // must still load once the custom endpoint is in.
  test("a block page opened directly loads from the custom node", async ({ page }) => {
    await mockCustomNode(page);
    const node: string[] = [];
    page.on("request", (r) => {
      if (r.url().startsWith(CUSTOM_NODE_URL)) node.push(r.url().slice(CUSTOM_NODE_URL.length));
    });
    await page.goto(`/block/${TX_BLOCK_HEIGHT}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      TX_BLOCK_HEIGHT.toLocaleString("en-US"),
      { timeout: 20_000 }
    );
    await expect(page.getByText("Could not load the block")).toHaveCount(0);
    expect(node.some((path) => path.includes("get_block_record_by_height"))).toBe(true);
  });

  test("settings and Test connection never call Coinset with a custom node", async ({ page }) => {
    await mockCustomNode(page);
    const coinset: string[] = [];
    page.on("request", (r) => {
      if (/api\.coinset\.org/.test(r.url())) coinset.push(r.url());
    });
    await page.goto("/settings");
    await expect(page.getByText("Live channel: Polling (custom node)")).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Test connection" }).first().click();
    await page.waitForTimeout(1_500);
    expect(coinset, "Coinset must not be called from Settings with a custom node").toEqual([]);
  });

  test("a syncing node is called out on every page, in the pill and in Test connection", async ({
    page,
  }) => {
    await mockCustomNode(page);
    // Registered after mockCustomNode, so it answers get_blockchain_state first: a node that
    // answers but is still catching up (the sync block a real one reports).
    const peak = blockchainState.blockchain_state.peak.height;
    await page.route(/https:\/\/node\.example\.test:8556\/get_blockchain_state/, (route) =>
      route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          ...blockchainState,
          blockchain_state: {
            ...blockchainState.blockchain_state,
            sync: {
              sync_mode: true,
              sync_progress_height: peak,
              sync_tip_height: peak + 20_000,
              synced: false,
            },
          },
        }),
      })
    );
    await page.goto("/");
    const notice = page.getByTestId("node-sync-notice");
    await expect(notice).toBeVisible({ timeout: 20_000 });
    await expect(notice).toContainText(
      `at ${peak.toLocaleString("en-US")} of ${(peak + 20_000).toLocaleString("en-US")}`
    );
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: /^Syncing via/ })
        .first()
    ).toBeAttached();

    await page.goto(`/block/${peak}`);
    await expect(page.getByTestId("node-sync-notice")).toBeVisible({ timeout: 20_000 });

    await page.goto("/settings");
    await page.getByRole("button", { name: "Test connection" }).first().click();
    await expect(page.getByText(/Node is still syncing: at/)).toBeVisible({ timeout: 10_000 });
  });
});
