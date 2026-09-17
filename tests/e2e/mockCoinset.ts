import type { Page, Route } from "@playwright/test";
import blockRecords from "../../src/test-utils/fixtures/block_records.json";
import { coinName } from "../../src/shared/lib/chia/coin";
import blockTransactions from "../../src/test-utils/fixtures/block_transactions.json";
import blockchainState from "../../src/test-utils/fixtures/blockchain_state.json";
import feeEstimate from "../../src/test-utils/fixtures/fee_estimate.json";
import fullBlock from "../../src/test-utils/fixtures/full_block.json";
import mempoolItems from "../../src/test-utils/fixtures/mempool_items.json";
import xchBalance from "../../src/test-utils/fixtures/xch_balance.json";
import catBalances from "../../src/test-utils/fixtures/cat_balances.json";

const NOW = Date.now();

/** The compact mempool summary the app assembles client-side from the recorded fixtures. */
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

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(body) });

export const TX_ID = blockTransactions.transactions[0]!.id;
export const TX_BLOCK_HEIGHT = 9295514;
export const TX_BLOCK_HASH = "7bcb5225f8b612363e3e4edfbe0699ed13135570336a23c694c57add8e778cef";

const hash = (n: number) => n.toString(16).padStart(64, "0");

/** Registry-known payout hash (XCHpool) so the pools page has one identified row to assert on. */
export const XCHPOOL_PUZZLE_HASH = "0d82c2e32037b77da9c8fdd5d1d4fa4b8cfa08026d2c04834906b741fdcb6fe2";
const UNKNOWN_POOL_PUZZLE_HASHES = [hash(0xf001), hash(0xf002)];

/** A block record shaped like Coinset's raw response, farmed by `poolPuzzleHash` at `height`. */
function syntheticBlockRecord(height: number, poolPuzzleHash: string) {
  return {
    height,
    header_hash: `0x${height.toString(16).padStart(64, "0")}`,
    prev_hash: `0x${(height - 1).toString(16).padStart(64, "0")}`,
    weight: 1,
    total_iters: 1,
    timestamp: null,
    fees: null,
    farmer_puzzle_hash: `0x${poolPuzzleHash}`,
    pool_puzzle_hash: `0x${poolPuzzleHash}`,
    prev_transaction_block_hash: null,
    prev_transaction_block_height: height - 1,
    reward_claims_incorporated: null,
    overflow: false,
    signage_point_index: 0,
    deficit: 0,
    sub_epoch_summary_included: null,
  };
}

/**
 * Synthesizes a window of block records for a height range the small fixture doesn't cover
 * (the pools page reads a 4,608-block window far behind the fixture's dozen recent blocks): half
 * the rotation goes to the registry-known XCHpool hash, the rest split across two unnamed hashes.
 */
function syntheticPoolWindow(start: number, end: number) {
  const pools = [XCHPOOL_PUZZLE_HASH, XCHPOOL_PUZZLE_HASH, ...UNKNOWN_POOL_PUZZLE_HASHES];
  const out = [];
  for (let h = start; h < end; h += 1) out.push(syntheticBlockRecord(h, pools[h % pools.length]!));
  return out;
}

function coinRecord(parent: string, puzzleHash: string, amount: bigint, opts: { coinbase?: boolean; spent?: boolean } = {}) {
  const coin = { parent_coin_info: `0x${parent}`, puzzle_hash: `0x${puzzleHash}`, amount: Number(amount) };
  const name = coinName({ parentCoinInfo: parent, puzzleHash, amount });
  const record = { coin, coinbase: opts.coinbase ?? false, confirmed_block_index: TX_BLOCK_HEIGHT, spent: opts.spent ?? false, spent_block_index: opts.spent ? TX_BLOCK_HEIGHT : 0, timestamp: 1_789_000_000 };
  return { name, record };
}

/**
 * Additions and removals of the transaction block with exact parent links: one spend creating
 * twelve coins (collapsed after ten), one creating a coin that is spent again in the same block,
 * and one reward coin.
 */
export function blockCoinFlow() {
  const big = coinRecord(hash(0xa1), hash(0xb1), 5_000_000_000_000n, { spent: true });
  const small = coinRecord(hash(0xa2), hash(0xb2), 300_000_000n, { spent: true });
  const children = Array.from({ length: 12 }, (_, i) => coinRecord(big.name, hash(0xc0 + i), BigInt(400_000_000_000 - i)));
  const ephemeral = coinRecord(small.name, hash(0xd1), 299_000_000n, { spent: true });
  const grandchild = coinRecord(ephemeral.name, hash(0xd2), 299_000_000n);
  const reward = coinRecord(hash(0xe1), P2, 875_000_000_000n, { coinbase: true });
  return {
    additions: [...children, ephemeral, grandchild, reward].map((c) => c.record),
    removals: [big, small, ephemeral].map((c) => c.record),
    success: true,
  };
}
export const P2 = "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4";

/** Route handler answering full-node RPC (and Coinset indexed) methods from the fixtures. */
export async function answerNodeMethod(route: Route) {
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
        const real = records.filter((r) => r.height >= start && r.height < end);
        if (real.length > 0) return json(route, { block_records: real, success: true });
        // A wide, fixture-uncovered range is the pools page's chunked scan over its 4,608-block window.
        if (end - start >= 500) return json(route, { block_records: syntheticPoolWindow(start, end), success: true });
        return json(route, { block_records: [], success: true });
      }
      case "get_network_space":
        return json(route, { space: 2_500_000_000_000_000_000, success: true });
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
          if (rec.fees) (block.transactions_info as Record<string, unknown>).generator_root = `0x${"74".repeat(32)}`;
        }
        return json(route, { block, success: true });
      }
      case "get_block_spends":
        return json(route, { block_spends: [], success: true });
      case "get_additions_and_removals":
        return json(route, String(body.header_hash).replace(/^0x/, "") === TX_BLOCK_HASH ? blockCoinFlow() : { additions: [], removals: [], success: true });
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
}

/** Record a "Reject all" decision so the consent panel does not cover controls under test. */
export async function seedConsent(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem("mempool-xch:consent:v1", JSON.stringify({ analytics: false, advertising: false, decidedAt: Date.now() }));
  });
}

/** Intercepts every Coinset call; anything unknown answers not found. */
export async function mockCoinset(page: Page, { consent = true }: { consent?: boolean } = {}) {
  if (consent) await seedConsent(page);
  await page.route(/https:\/\/(testnet11\.)?api\.coinset\.org\/.*/, answerNodeMethod);
  // WebSocket: block the upgrade so the app falls back to polling deterministically.
  await page.routeWebSocket(/wss:\/\/.*coinset\.org\/ws.*/, (ws) => ws.close());
}

export const CUSTOM_NODE_URL = "https://node.example.test:8556";

/** A custom full-node RPC (not Coinset): the app must poll and fetch the mempool itself. */
export async function mockCustomNode(page: Page) {
  await seedConsent(page);
  await page.addInitScript((rpcUrl) => {
    window.localStorage.setItem(
      "mempool-xch:settings:v1",
      JSON.stringify({ network: "mainnet", endpoints: { mainnet: { rpcUrl }, testnet11: { rpcUrl: "https://testnet11.api.coinset.org" } }, theme: "dark", recentBlocks: 8 })
    );
  }, CUSTOM_NODE_URL);
  await page.route(/https:\/\/node\.example\.test:8556\/.*/, answerNodeMethod);
  // Anything that still goes to Coinset is a bug: answer 599 so the test can see it.
  await page.route(/https:\/\/(testnet11\.)?api\.coinset\.org\/.*/, (route) => route.fulfill({ status: 599, body: "must not be called with a custom node" }));
}
