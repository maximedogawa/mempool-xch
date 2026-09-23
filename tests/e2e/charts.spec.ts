import { expect, test, type Page } from "@playwright/test";
import fullBlock from "../../src/test-utils/fixtures/full_block.json";
import { blockCoinFlow, mockCoinset } from "./mockCoinset";

const DIFFICULTY = 2160;
const PEAK = 9295519;

/** Gate.io XCH_USDT candles: the last close is 10.92. */
async function mockPriceHistory(page: Page) {
  const now = Math.floor(Date.now() / 1000);
  const closes = [10.5, 10.61, 10.7, 10.66, 10.8, 10.92];
  await page.route("https://api.gateio.ws/api/v4/spot/candlesticks**", (route) =>
    route.fulfill({
      json: closes.map((close, i) => [
        String(now - (closes.length - i) * 900),
        "1000",
        String(close),
        String(close + 0.05),
        String(close - 0.05),
        String(close),
        "90",
        "true",
      ]),
    })
  );
}

/**
 * Every chart window gets records (the fixture only covers a dozen heights near the peak):
 * weight rises by DIFFICULTY per height, every third block is a transaction block, and each
 * sampled transaction block has a cost of 5.5 billion and spends 3 coins. Registered after
 * mockCoinset, so it takes precedence for these three methods only.
 */
async function mockChartChain(page: Page) {
  const nowS = Math.floor(Date.now() / 1000);
  const hashOf = (h: number) => `0x${h.toString(16).padStart(64, "0")}`;
  await page.route(
    /https:\/\/api\.coinset\.org\/(get_block_records|get_block|get_additions_and_removals)$/,
    (route) => {
      const method = new URL(route.request().url()).pathname.slice(1);
      const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      if (method === "get_block_records") {
        const records = [];
        for (let h = Number(body.start); h < Number(body.end); h += 1) {
          const tx = h % 3 === 0;
          records.push({
            height: h,
            header_hash: hashOf(h),
            prev_hash: hashOf(h - 1),
            weight: h * DIFFICULTY,
            total_iters: h,
            timestamp: tx ? Math.round(nowS - (PEAK - h) * 18.75) : null,
            fees: tx ? 1000 : null,
            farmer_puzzle_hash: hashOf(1),
            pool_puzzle_hash: hashOf(2),
            prev_transaction_block_hash: null,
            prev_transaction_block_height: h - 1,
            reward_claims_incorporated: null,
            overflow: false,
            signage_point_index: 0,
            deficit: 0,
            sub_epoch_summary_included: null,
          });
        }
        return route.fulfill({ json: { block_records: records, success: true } });
      }
      if (method === "get_block") {
        const block = JSON.parse(JSON.stringify(fullBlock.block)) as Record<string, unknown>;
        (block.transactions_info as Record<string, unknown>).cost = 5_500_000_000;
        return route.fulfill({ json: { block, success: true } });
      }
      return route.fulfill({ json: blockCoinFlow() });
    }
  );
}

test.describe("charts", () => {
  test.beforeEach(async ({ page }) => {
    await mockCoinset(page);
    await mockPriceHistory(page);
  });

  test("only series with a data source are listed, each with a definition", async ({ page }) => {
    await page.goto("/charts");
    await expect(page.getByRole("heading", { level: 1, name: "Charts" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Fees per transaction block" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Netspace" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Blocks per hour", exact: true })).toBeVisible();

    await expect(page.getByRole("heading", { name: "XCH price (USDT)" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Median fee rate" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cost per transaction block" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Spends per transaction block" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Difficulty" })).toBeVisible();

    // Coin-set aggregates have no public source and were dropped, not greyed out.
    await expect(page.getByRole("heading", { name: "Unspent coins" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Coin set" })).toHaveCount(0);

    // Every shown chart carries its definition and technical note.
    const definitions = page.getByText("Definition & technical note");
    expect(await definitions.count()).toBe(14);
  });

  test("price, difficulty, cost and spends come from their sources", async ({ page }) => {
    await mockChartChain(page);
    await page.goto("/charts");
    // Raw points, so the latest value is the last candle's close rather than a moving average.
    await page
      .getByRole("radiogroup", { name: "Smoothing", exact: true })
      .getByRole("radio", { name: "Raw" })
      .click();
    const card = (title: string) =>
      page.locator("section div").filter({
        has: page.getByRole("heading", { name: title, exact: true }),
      });
    await expect(
      card("XCH price (USDT)").getByText("10.920 USDT").filter({ visible: true }).first()
    ).toBeVisible();
    await expect(
      card("Difficulty").getByText("2,160", { exact: true }).filter({ visible: true }).first()
    ).toBeVisible();
    await expect(
      card("Cost per transaction block").getByText("5.50B").filter({ visible: true }).first()
    ).toBeVisible();
    await expect(
      card("Spends per transaction block")
        .getByText("3", { exact: true })
        .filter({ visible: true })
        .first()
    ).toBeVisible();

    // The technical note describes the real computation.
    const note = page.locator("details").filter({ hasText: /weight step from one height/ });
    await note.locator("summary").click();
    await expect(note.getByText(/weight step from one height to the next/)).toBeVisible();
  });

  test("price history that does not answer shows a note, not a broken chart", async ({ page }) => {
    await page.route("https://api.gateio.ws/api/v4/spot/candlesticks**", (route) =>
      route.fulfill({ status: 503, body: "" })
    );
    await page.goto("/charts");
    await expect(page.getByText(/Gate.io's price history did not answer/)).toBeVisible();
  });

  test("range, smoothing and scale controls are keyboard-accessible radiogroups", async ({
    page,
  }) => {
    await page.goto("/charts");
    const rangeGroup = page.getByRole("radiogroup", { name: "Range", exact: true });
    const day = rangeGroup.getByRole("radio", { name: "24h" });
    const week = rangeGroup.getByRole("radio", { name: "7d" });
    await expect(day).toHaveAttribute("aria-checked", "true");
    await expect(week).toHaveAttribute("aria-checked", "false");

    await week.focus();
    await week.press("Enter");
    await expect(week).toHaveAttribute("aria-checked", "true");
    await expect(day).toHaveAttribute("aria-checked", "false");

    const scaleGroup = page.getByRole("radiogroup", { name: "Scale", exact: true });
    const log = scaleGroup.getByRole("radio", { name: "Log" });
    await log.focus();
    await log.press("Enter");
    await expect(log).toHaveAttribute("aria-checked", "true");
  });

  test("mempool charts read the existing 2h browser sample, unavailable outside it", async ({
    page,
  }) => {
    await page.goto("/charts");
    await expect(page.getByRole("heading", { name: "Cost used" })).toBeVisible();
    // Freshly loaded in this test, the 2h sampler has under two points yet: shows the note.
    await expect(page.getByText(/sampled in this browser/).first()).toBeVisible();

    const rangeGroup = page.getByRole("radiogroup", { name: "Range", exact: true });
    await rangeGroup.getByRole("radio", { name: "30d" }).click();
    await expect(page.getByText(/Only the last 2 hours are sampled/).first()).toBeVisible();
  });
});
