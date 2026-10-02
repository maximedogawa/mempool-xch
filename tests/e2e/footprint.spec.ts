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

    // One call per kind of data, the mempool included: the gateway hands every pending
    // transaction over at once and its socket says what changes. The exceptions: one
    // get_block_transactions per recent block whose totals are not in localStorage yet (six
    // in the mock), and get_reorgs twice on a first visit (the block time card, and the index
    // probe, which is then remembered for an hour).
    const once = [
      "get_blockchain_state",
      "get_fee_estimate",
      "get_block_records",
      "x/node/v1/mempool/items",
    ];
    for (const method of once)
      expect(counts[method] ?? 0, `${method} is asked once`).toBeLessThanOrEqual(1);
    for (const method of ["get_all_mempool_tx_ids", "get_mempool_item_by_tx_id"])
      expect(counts[method] ?? 0, `${method} is not needed`).toBe(0);
    expect(counts.get_reorgs ?? 0).toBeLessThanOrEqual(2);
    expect(seen.requests.length, JSON.stringify(counts)).toBeLessThanOrEqual(12);
  });
});
