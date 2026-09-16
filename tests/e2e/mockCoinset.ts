import type { Page, Route } from "@playwright/test";
import blockRecords from "../../src/test-utils/fixtures/block_records.json";
import blockTransactions from "../../src/test-utils/fixtures/block_transactions.json";
import blockchainState from "../../src/test-utils/fixtures/blockchain_state.json";
import feeEstimate from "../../src/test-utils/fixtures/fee_estimate.json";
import fullBlock from "../../src/test-utils/fixtures/full_block.json";
import mempoolItems from "../../src/test-utils/fixtures/mempool_items.json";
import xchBalance from "../../src/test-utils/fixtures/xch_balance.json";
import catBalances from "../../src/test-utils/fixtures/cat_balances.json";
import { CHIA } from "../../src/shared/config/networks";
import { stringifyJsonTagged } from "../../src/shared/lib/rpc/json";
import { normaliseBlockchainState, normaliseBlockRecord, normaliseFeeEstimate } from "../../src/shared/lib/rpc/normalise";

const NOW = Date.now();

/** Compact summary the way /api/mainnet/mempool would answer, built from the recorded items. */
export function mockSummary() {
  const items = Object.values(mempoolItems.mempool_items).map((item, i) => ({
    id: item.spend_bundle_name.replace(/^0x/, ""),
    fee: String(item.fee + i * 1_000_000),
    cost: item.cost,
    feeRate: (item.fee + i * 1_000_000) / item.cost,
    spends: item.spend_bundle.coin_spends.length,
    additions: item.additions.slice(0, 4).map((c) => ({ ph: c.puzzle_hash.slice(2), amount: String(c.amount), parent: c.parent_coin_info.slice(2) })),
    removals: item.removals.map((c) => ({ ph: c.puzzle_hash.slice(2), amount: String(c.amount), parent: c.parent_coin_info.slice(2) })),
    additionCount: item.additions.length,
    removalCount: item.removals.length,
    assets: { xch: String(item.removals.reduce((s, c) => s + c.amount, 0)), cats: i === 1 ? [{ assetId: "00000000024e1fb9fc47c7ec72854c6a987c4cc99f6535a4caca6154220eeda5", amount: "1234" }] : [], nfts: 0, dids: 0, singletons: 0 },
    firstSeen: NOW - (i + 1) * 30_000,
    kind: i === 1 ? "cat" : "xch",
    assetIds: [],
  }));
  const s = blockchainState.blockchain_state;
  return {
    network: "mainnet",
    generatedAt: NOW,
    source: "server",
    state: {
      peakHeight: s.peak.height,
      peakHash: s.peak.header_hash.slice(2),
      lastTxBlockHeight: s.peak.prev_transaction_block_height,
      mempoolSize: items.length,
      mempoolCost: items.reduce((a, i) => a + i.cost, 0),
      mempoolMaxTotalCost: s.mempool_max_total_cost,
      mempoolFees: String(items.reduce((a, i) => a + Number(i.fee), 0)),
      blockMaxCost: s.block_max_cost,
      averageBlockTime: s.average_block_time,
      minFeeRate: 0,
      synced: true,
    },
    items,
  };
}

/** The hosted chain cache the way /api/mainnet/chain would answer, from the recorded fixtures. */
export function mockChain() {
  // The server window always includes the peak; the recorded records stop one below it.
  const blocks = [...blockRecords.block_records, blockchainState.blockchain_state.peak].map(normaliseBlockRecord).sort((a, b) => b.height - a.height);
  return {
    network: "mainnet",
    generatedAt: NOW,
    channel: "websocket",
    state: normaliseBlockchainState(blockchainState.blockchain_state),
    blocks,
    stats: [],
    fee: { cost: CHIA.REFERENCE_SPEND_COST, estimate: normaliseFeeEstimate(feeEstimate) },
  };
}

/** A short server-sent events body: status, one peak, then the browser waits 60 s to reconnect. */
export function mockEventsBody() {
  const peak = blockchainState.blockchain_state.peak;
  return [
    "retry: 60000\n\n",
    `event: status\ndata: ${JSON.stringify({ channel: "websocket", seq: 1 })}\n\n`,
    `id: 1\nevent: peak\ndata: ${JSON.stringify({ height: peak.height, tx: true, at: NOW })}\n\n`,
    `id: 2\nevent: live\ndata: ${JSON.stringify({ txCount: 3, totalCost: 1, totalFee: "0", avgFeeRate: 0, backlogBlocks: 0, at: NOW })}\n\n`,
  ].join("");
}

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });

export const TX_ID = blockTransactions.transactions[0]!.id;
export const TX_BLOCK_HEIGHT = 9295514;
export const P2 = "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4";

/** Intercepts every Coinset call and the summary API; anything unknown answers not found. */
export async function mockCoinset(page: Page) {
  await page.route("**/api/mainnet/mempool", (route) => json(route, mockSummary()));
  await page.route("**/api/testnet11/mempool", (route) => json(route, { ...mockSummary(), network: "testnet11" }));
  await page.route("**/api/mainnet/chain**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: stringifyJsonTagged(mockChain()) }));
  await page.route("**/api/testnet11/chain**", (route) => route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: stringifyJsonTagged({ ...mockChain(), network: "testnet11" }) }));
  await page.route("**/api/*/events**", (route) => route.fulfill({ status: 200, contentType: "text/event-stream", headers: { "access-control-allow-origin": "*", "cache-control": "no-cache" }, body: mockEventsBody() }));
  await page.route(/https:\/\/(testnet11\.)?api\.coinset\.org\/.*/, async (route) => {
    const url = new URL(route.request().url());
    const method = url.pathname.slice(1);
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
    } catch {
      body = {};
    }
    const records = blockRecords.block_records;
    switch (method) {
      case "get_blockchain_state":
        return json(route, blockchainState);
      case "get_all_mempool_tx_ids":
        return json(route, { tx_ids: Object.keys(mempoolItems.mempool_items), success: true });
      case "get_all_mempool_items":
        return json(route, mempoolItems);
      case "get_mempool_item_by_tx_id": {
        const id = String(body.tx_id ?? "").replace(/^0x/, "");
        const item = Object.values(mempoolItems.mempool_items).find((i) => i.spend_bundle_name.slice(2) === id);
        return json(route, item ? { mempool_item: item, success: true } : { success: false, error: `Tx id ${id} not in mempool` });
      }
      case "get_mempool_items_by_coin_name":
        return json(route, { mempool_items: [], success: true });
      case "get_fee_estimate":
        return json(route, feeEstimate);
      case "get_block_records": {
        const start = Number(body.start ?? 0);
        const end = Number(body.end ?? 0);
        return json(route, { block_records: records.filter((r) => r.height >= start && r.height < end), success: true });
      }
      case "get_block_record_by_height": {
        const rec = records.find((r) => r.height === Number(body.height));
        return json(route, rec ? { block_record: rec, success: true } : { success: false, error: "Block height not found" });
      }
      case "get_block_record": {
        const rec = records.find((r) => r.header_hash === body.header_hash);
        return json(route, rec ? { block_record: rec, success: true } : { success: false, error: "Block not found" });
      }
      case "get_block": {
        const rec = records.find((r) => r.header_hash === body.header_hash);
        if (!rec) return json(route, { success: false, error: "Block not found" });
        const block = JSON.parse(JSON.stringify(fullBlock.block)) as Record<string, unknown>;
        (block.reward_chain_block as Record<string, unknown>).height = rec.height;
        if (rec.timestamp === null) {
          block.foliage_transaction_block = null;
          block.transactions_info = null;
        } else {
          (block.foliage_transaction_block as Record<string, unknown>).timestamp = rec.timestamp;
          (block.transactions_info as Record<string, unknown>).fees = rec.fees;
          (block.transactions_info as Record<string, unknown>).cost = rec.fees ? 80587336 : 0;
        }
        return json(route, { block, success: true });
      }
      case "get_block_spends":
        return json(route, { block_spends: [], success: true });
      case "get_additions_and_removals":
        return json(route, { additions: [], removals: [], success: true });
      case "get_block_transactions":
        return json(route, Number(body.height) === TX_BLOCK_HEIGHT ? blockTransactions : { transactions: [], success: true });
      case "get_transaction": {
        const id = String(body.tx_id ?? "").replace(/^0x/, "");
        return json(route, { transaction: id === TX_ID ? blockTransactions.transactions[0] : null, success: true });
      }
      case "get_coin_record_by_name":
        return json(route, { success: false, error: "Coin record not found" });
      case "get_coin_records_by_puzzle_hash":
      case "get_coin_records_by_hint":
      case "get_coin_records_by_parent_ids":
      case "get_coin_records_by_names":
        return json(route, { coin_records: [], success: true });
      case "get_xch_balance_by_p2":
        return json(route, xchBalance);
      case "get_cat_balances_by_p2":
        return json(route, catBalances);
      case "get_nft_balance_by_p2":
        return json(route, { p2: `0x${P2}`, confirmed_balance: "2", locked_balance: "0", pending_balance: "0", pending_locked_balance: "0", success: true });
      case "get_transactions_by_p2":
        return json(route, blockTransactions);
      case "get_pending_transactions_by_p2":
        return json(route, { transactions: [], success: true });
      case "get_transactions_by_cat_asset_id":
      case "get_transactions_by_nft_id":
      case "get_transactions_by_coin_name":
        return json(route, { transactions: [], success: true });
      case "get_coin_details":
        return json(route, { success: false, error: "not found" }, 404);
      case "get_singleton_info":
        return json(route, { launcher_id: body.launcher_id, singleton_type: null, coin_record: null, success: true });
      case "get_latest_nft_coin_by_nft_id":
        return json(route, { nft_coin_record: null, success: true });
      default:
        return json(route, { success: false, error: `unmocked method ${method}` }, 404);
    }
  });
  // WebSocket: block the upgrade so the app falls back to polling deterministically.
  await page.routeWebSocket(/wss:\/\/.*coinset\.org\/ws.*/, (ws) => ws.close());
}
