import { expect, test } from "@playwright/test";
import { mockDexie, mockNodexch, mockXchTicker } from "./mockCoinset";

/**
 * How many gateway calls a dashboard costs (TASK-115). A nodexch plan is a monthly request
 * quota and a rate a minute, so every call a page makes is paid for: the load is counted per
 * method here and held to a budget, and the open tab must stay quiet while the socket is live.
 */
const SETTLE_MS = 20_000;

function countByMethod(requests: { url: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of requests) {
    const method = new URL(r.url).pathname.slice(1);
    counts[method] = (counts[method] ?? 0) + 1;
  }
  return counts;
}

test.describe("nodexch request footprint", () => {
  test("a dashboard load stays within its request budget", async ({ page }) => {
    test.setTimeout(90_000);
    await mockDexie(page);
    await mockXchTicker(page);
    const seen = await mockNodexch(page);
    await page.goto("/");
    await expect(
      page.getByRole("list", { name: "Recent transaction blocks" }).getByRole("listitem").first()
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("status").filter({ hasText: "Live" }).first()).toBeVisible({
      timeout: 20_000,
    });
    // Past the deferred widgets (2 s idle) and several of the old poll intervals.
    await page.waitForTimeout(SETTLE_MS);
    const counts = countByMethod(seen.requests);
    console.log(`nodexch requests in ${SETTLE_MS / 1000} s:`, seen.requests.length, counts);

    // The load is one call: the gateway's dashboard answers the state, the fee quote, the
    // recent blocks with their records and asset totals and the mempool items at once, and its
    // socket says what changes. Beside it, on a first visit: the token registry (Dexie's list
    // through the gateway, then kept in localStorage), the index probe (a balance, remembered
    // for an hour) and get_reorgs for the block time card (a gateway that keeps no reorg log is
    // not asked again for an hour).
    expect(counts["x/node/v1/dashboard"] ?? 0, "the dashboard is asked once").toBe(1);
    for (const method of [
      "get_blockchain_state",
      "get_fee_estimate",
      "get_block_records",
      "get_block_transactions",
      "x/node/v1/mempool/items",
      "get_all_mempool_tx_ids",
      "get_mempool_item_by_tx_id",
    ])
      expect(counts[method] ?? 0, `${method} is not needed`).toBe(0);
    for (const method of ["get_reorgs", "get_xch_balance_by_p2", "dexie/v1/assets"])
      expect(counts[method] ?? 0, `${method} is asked once`).toBeLessThanOrEqual(1);
    expect(seen.requests.length, JSON.stringify(counts)).toBeLessThanOrEqual(4);
    expect(seen.dexie, "Dexie itself is not asked").toEqual([]);
  });
});
