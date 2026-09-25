import type { Page, Route } from "@playwright/test";
import blockRecords from "../../src/test-utils/fixtures/block_records.json";
import { coinName } from "../../src/shared/lib/chia/coin";
import blockTransactions from "../../src/test-utils/fixtures/block_transactions.json";
import blockchainState from "../../src/test-utils/fixtures/blockchain_state.json";
import feeEstimate from "../../src/test-utils/fixtures/fee_estimate.json";
import fullBlock from "../../src/test-utils/fixtures/full_block.json";
import mempoolItems from "../../src/test-utils/fixtures/mempool_items.json";
import poolClaimSelfTx from "../../src/test-utils/fixtures/pool_claim_self_tx.json";
import poolClaimTx from "../../src/test-utils/fixtures/pool_claim_tx.json";
import xchBalance from "../../src/test-utils/fixtures/xch_balance.json";
import catBalances from "../../src/test-utils/fixtures/cat_balances.json";
import offerState from "../../src/test-utils/fixtures/offer_state.json";
import offersByCat from "../../src/test-utils/fixtures/offers_by_cat.json";
import rawTxXch from "../../src/test-utils/fixtures/raw_tx_xch.json";
import reorgs from "../../src/test-utils/fixtures/reorgs.json";
import arcade from "../../src/shared/config/arcade.json";

const NOW = Date.now();

/** The compact mempool summary the app assembles client-side from the recorded fixtures. */
export function mockSummary() {
  const items = Object.values(mempoolItems.mempool_items).map((item, i) => ({
    id: item.spend_bundle_name.replace(/^0x/, ""),
    fee: String(item.fee + i * 1_000_000),
    cost: item.cost,
    feeRate: (item.fee + i * 1_000_000) / item.cost,
    spends: item.spend_bundle.coin_spends.length,
    additions: item.additions.slice(0, 4).map((c) => ({
      ph: c.puzzle_hash.slice(2),
      amount: String(c.amount),
      parent: c.parent_coin_info.slice(2),
    })),
    removals: item.removals.map((c) => ({
      ph: c.puzzle_hash.slice(2),
      amount: String(c.amount),
      parent: c.parent_coin_info.slice(2),
    })),
    additionCount: item.additions.length,
    removalCount: item.removals.length,
    assets: {
      xch: String(item.removals.reduce((s, c) => s + c.amount, 0)),
      cats:
        i === 1
          ? [
              {
                assetId: "00000000024e1fb9fc47c7ec72854c6a987c4cc99f6535a4caca6154220eeda5",
                amount: "1234",
              },
            ]
          : [],
      nfts: 0,
      dids: 0,
      singletons: 0,
    },
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
  route.fulfill({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });

export const TX_ID = blockTransactions.transactions[0]!.id;
/** The recorded confirmed DBX-for-XCH offer (offer_state.json). */
export const OFFER_ID = offerState.offer_id;
export const OFFER_CAT_ASSET_ID = offersByCat.asset_id;
export const TX_BLOCK_HEIGHT = 9295514;
export const TX_BLOCK_HASH = "7bcb5225f8b612363e3e4edfbe0699ed13135570336a23c694c57add8e778cef";

const hash = (n: number) => n.toString(16).padStart(64, "0");

/** Registry-known fixed payout hash (H9.com): named without any claim lookup. */
export const NAMED_POOL_PUZZLE_HASH =
  "4bc6435b409bcbabe53870dae0f03755f6aabb4594c5915ec983acf12a5d1fba";
/** Two PlotNFT farmers (farmer reward elsewhere) whose mocked claims both go to Spacefarmers.io's target. */
export const PLOT_NFT_PUZZLE_HASHES = [hash(0xa001), hash(0xa002)];
/** A solo farmer paying both shares to one address: never looked up, stays "Unknown". */
const UNKNOWN_POOL_PUZZLE_HASH = hash(0xf001);
const FARMER_PUZZLE_HASH = hash(0xfa00);

/** The payout address in pool_claim_tx.json and in pool_claim_self_tx.json (fixture block 9295513's). */
const CLAIM_FIXTURE_PAYOUT = "cabeeede115c96d3bd78f05c46f2d0cb0cfefdaa364f419d69436ad7b7b84bba";
const SELF_POOLED_PAYOUT = "ab14af9c3ed5eebe19d2ca15586bac0b85dabd3c640055bee1685e466a348adc";

/** The latest transaction of a payout address, when the mock knows it as a PlotNFT (src/shared/lib/pools/claims.ts). */
function poolClaimFor(p2: string) {
  if (p2 === SELF_POOLED_PAYOUT) return poolClaimSelfTx.transaction;
  if (!PLOT_NFT_PUZZLE_HASHES.includes(p2)) return null;
  return JSON.parse(
    JSON.stringify(poolClaimTx.transaction).replaceAll(CLAIM_FIXTURE_PAYOUT, p2)
  ) as unknown;
}

/** A block record shaped like Coinset's raw response, farmed by `poolPuzzleHash` at `height`. */
function syntheticBlockRecord(height: number, poolPuzzleHash: string) {
  const plotNft = PLOT_NFT_PUZZLE_HASHES.includes(poolPuzzleHash);
  return {
    height,
    header_hash: `0x${height.toString(16).padStart(64, "0")}`,
    prev_hash: `0x${(height - 1).toString(16).padStart(64, "0")}`,
    weight: 1,
    total_iters: 1,
    timestamp: null,
    fees: null,
    farmer_puzzle_hash: `0x${plotNft ? FARMER_PUZZLE_HASH : poolPuzzleHash}`,
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
 * (the pools page reads a 4,608-block window far behind the fixture's dozen recent blocks): a
 * quarter to H9.com's fixed address, a quarter each to two PlotNFT farmers of one pool, and a
 * quarter to an unknown both-shares address.
 */
function syntheticPoolWindow(start: number, end: number) {
  const pools = [NAMED_POOL_PUZZLE_HASH, ...PLOT_NFT_PUZZLE_HASHES, UNKNOWN_POOL_PUZZLE_HASH];
  const out = [];
  for (let h = start; h < end; h += 1) out.push(syntheticBlockRecord(h, pools[h % pools.length]!));
  return out;
}

/** Dexie CAT registry entries for the tokens page: a busy token, a quiet one and a silent one. */
export const TOKEN_ACTIVE = hash(0x1111);
export const TOKEN_QUIET = hash(0x2222);
export const TOKEN_SILENT = hash(0x3333);

const DEXIE_ASSETS = [
  { id: `0x${TOKEN_ACTIVE}`, code: "MAT", name: "Most Active Token", liquidity: [120.5, 9000] },
  { id: `0x${TOKEN_QUIET}`, code: "QT", name: "Quiet Token", liquidity: [800, 10] },
  { id: `0x${TOKEN_SILENT}`, code: "SIL", name: "Silent Token" },
  { id: `0x${hash(0xa001)}`, code: "ALP", name: "Alpha Coin" },
  { id: `0x${hash(0xa002)}`, code: "ZET", name: "Zeta Coin" },
];

const TOKEN_ACTIVITY_SEED: Record<string, { count: number; amountEach: bigint }> = {
  [TOKEN_ACTIVE]: { count: 15, amountEach: 1_000_000n },
  [TOKEN_QUIET]: { count: 1, amountEach: 100n },
};

function syntheticCatTx(index: number, confirmedAtMs: number, assetId: string, amount: bigint) {
  return {
    id: hash(0x9000 + index),
    source: "mempool",
    status: "confirmed",
    cost: 1_000_000,
    fee_mojos: "0",
    first_seen_ms: confirmedAtMs,
    confirmed_height: TX_BLOCK_HEIGHT,
    confirmed_header_hash: TX_BLOCK_HASH,
    confirmed_at_ms: confirmedAtMs,
    last_updated_ms: confirmedAtMs,
    events: [
      {
        type: "Transfer",
        fee_mojos: "0",
        participants: [
          {
            p2: `0x${hash(1)}`,
            sent: { xch: "0", cats: [], nfts: [] },
            received: {
              xch: "0",
              cats: [{ asset_id: `0x${assetId}`, amount: String(amount) }],
              nfts: [],
            },
          },
        ],
        inputs: [],
        outputs: [],
        memos: [],
      },
    ],
  };
}

/** Deterministic recent-first activity for a mocked token; empty for anything not seeded. */
function syntheticCatActivity(assetId: string) {
  const seed = TOKEN_ACTIVITY_SEED[assetId];
  if (!seed) return [];
  return Array.from({ length: seed.count }, (_, i) =>
    syntheticCatTx(i, NOW - i * 3_600_000, assetId, seed.amountEach)
  );
}

function coinRecord(
  parent: string,
  puzzleHash: string,
  amount: bigint,
  opts: { coinbase?: boolean; spent?: boolean } = {}
) {
  const coin = {
    parent_coin_info: `0x${parent}`,
    puzzle_hash: `0x${puzzleHash}`,
    amount: Number(amount),
  };
  const name = coinName({ parentCoinInfo: parent, puzzleHash, amount });
  const record = {
    coin,
    coinbase: opts.coinbase ?? false,
    confirmed_block_index: TX_BLOCK_HEIGHT,
    spent: opts.spent ?? false,
    spent_block_index: opts.spent ? TX_BLOCK_HEIGHT : 0,
    timestamp: 1_789_000_000,
  };
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
  const children = Array.from({ length: 12 }, (_, i) =>
    coinRecord(big.name, hash(0xc0 + i), BigInt(400_000_000_000 - i))
  );
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
/** When the mocked potato snatch happened: an hour before the test run. */
export const POTATO_TAKEN_AT = Math.floor(NOW / 1000) - 3_600;

/** Mocked prefarm custody vaults (src/shared/lib/prefarm/vaults.ts): the singleton coin sits at the first address of each. */
const PREFARM_SINGLETONS: Record<string, { puzzleHash: string; amount: bigint }> = {
  "6c77dce3c3bab525dab7883e8ad513a8f3ff127e872009b12836cbb1c8f26647": {
    puzzleHash: "21810d9384937e833ab004915603e0653705005933df43ea7cd56320677be8dd",
    amount: 2_437_500_000_000_000_000n,
  },
  "355042db2e191d9176c25d3e059524265653549cee0fc65c4ed235d58bf8e659": {
    puzzleHash: "94dfb96a8c234e3ed624f4fa1686af5e5de65a90aa6cc8513402ebb848508278",
    amount: 8_375_000_000_000_000_000n,
  },
  d76ef7df8cfab2d8514f58e72fd12f2e7f5ada69db6eb5be90f084cfa37a29a2: {
    puzzleHash: "5071e05aba59fb65b60df4205d070b685ea8ea19376c9835900653c0109ffc6e",
    amount: 650_000_000_000_000_000n,
  },
  a26cb54f7b9e8f38e2ee903880468ba262f5a1b39fe123c88053b14fac66ad10: {
    puzzleHash: "3dc2fea720de193d7a8d006664dede4210ec065debefcc5697e73c55dbbd51db",
    amount: 42_500_000_000_000_000n,
  },
};
const PREFARM_COINS: Record<string, bigint> = Object.fromEntries(
  Object.values(PREFARM_SINGLETONS).map((v) => [v.puzzleHash, v.amount])
);
/** The example Chia Vault on the vaults page: launcher, singleton coin and the p2 address holding its funds. */
export const VAULT_LAUNCHER = "a4860e521551d49691d6985eb1b88dde44e38c5f7ac1ce39f3a33c4371005201";
export const VAULT_ADDRESS = "xch1lv34uumcyg892zrv35rhrx87hu5nx87em7zcag5nc2vjecupkdzspc9xn6";
PREFARM_SINGLETONS[VAULT_LAUNCHER] = {
  puzzleHash: "e2d2aaf0fe5cbaefc92438c6a4ca1ec3b8568388b550234ac77f77d4a7948b68",
  amount: 1n,
};
PREFARM_COINS["fb235e7378220e55086c8d077198febf29331fd9df858ea293c2992ce381b345"] =
  41_991_000_000_000_000n;

/** A real pending mempool item's id (mempool_items.json's first entry), reused for the watchlist. */
export const WATCHED_PENDING_TX_ID =
  "124ef3da229ff0ea200bbaed36fd8d31b00db2378f3226977cb2cc93c1c450dd";

function watchedPendingTx() {
  return {
    schema_version: 1,
    id: WATCHED_PENDING_TX_ID,
    source: "mempool",
    status: "pending",
    cost: 1_000_000,
    fee_mojos: "0",
    first_seen_ms: NOW,
    confirmed_height: null,
    confirmed_header_hash: null,
    confirmed_at_ms: null,
    last_updated_ms: NOW,
    events: [
      {
        type: "Transfer",
        fee_mojos: "0",
        participants: [
          {
            p2: `0x${P2}`,
            sent: { xch: "0", cats: [], nfts: [] },
            received: { xch: "500000000", cats: [], nfts: [] },
          },
        ],
        inputs: [],
        outputs: [],
        memos: [],
      },
    ],
  };
}

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
      const item = Object.values(mempoolItems.mempool_items).find(
        (i) => i.spend_bundle_name.slice(2) === id
      );
      return json(
        route,
        item
          ? { mempool_item: item, success: true }
          : { success: false, error: `Tx id ${id} not in mempool` }
      );
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
      if (end - start >= 500)
        return json(route, { block_records: syntheticPoolWindow(start, end), success: true });
      return json(route, { block_records: [], success: true });
    }
    case "get_network_space":
      return json(route, { space: 2_500_000_000_000_000_000, success: true });
    case "get_block_record_by_height": {
      const rec = records.find((r) => r.height === Number(body.height));
      return json(
        route,
        rec
          ? { block_record: rec, success: true }
          : { success: false, error: "Block height not found" }
      );
    }
    case "get_block_record": {
      const rec = records.find((r) => r.header_hash === body.header_hash);
      return json(
        route,
        rec ? { block_record: rec, success: true } : { success: false, error: "Block not found" }
      );
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
        if (rec.fees)
          (block.transactions_info as Record<string, unknown>).generator_root =
            `0x${"74".repeat(32)}`;
      }
      return json(route, { block, success: true });
    }
    case "get_block_spends":
      return json(route, { block_spends: [], success: true });
    case "get_additions_and_removals":
      return json(
        route,
        String(body.header_hash).replace(/^0x/, "") === TX_BLOCK_HASH
          ? blockCoinFlow()
          : { additions: [], removals: [], success: true }
      );
    case "get_block_transactions":
      return json(
        route,
        Number(body.height) === TX_BLOCK_HEIGHT
          ? blockTransactions
          : { transactions: [], success: true }
      );
    case "get_transaction": {
      const id = String(body.tx_id ?? "").replace(/^0x/, "");
      return json(route, {
        transaction: id === TX_ID ? blockTransactions.transactions[0] : null,
        success: true,
      });
    }
    case "get_coin_record_by_name":
      return json(route, { success: false, error: "Coin record not found" });
    case "get_coin_records_by_puzzle_hash": {
      // The prefarm vaults' addresses hold coins; every other puzzle hash is empty.
      const ph = String(body.puzzle_hash ?? "").replace(/^0x/, "");
      const held = PREFARM_COINS[ph];
      return json(route, {
        coin_records: held ? [coinRecord(hash(0x9f), ph, held).record] : [],
        success: true,
      });
    }
    case "get_coin_records_by_parent_ids": {
      // One fresh Pot Potato snatch on top of the committed snapshot tip, taken an hour ago.
      const parents = (Array.isArray(body.parent_ids) ? body.parent_ids : []).map((p) =>
        String(p).replace(/^0x/, "")
      );
      if (parents.includes(arcade.potato.coinId)) {
        const child = {
          parent_coin_info: `0x${arcade.potato.coinId}`,
          puzzle_hash: `0x${hash(0x9074)}`,
          amount: Number(BigInt(arcade.potato.amount) + 1_000_000_000_000n),
        };
        return json(route, {
          coin_records: [
            {
              coin: child,
              coinbase: false,
              confirmed_block_index: arcade.potato.height + 5_000,
              spent: false,
              spent_block_index: 0,
              timestamp: POTATO_TAKEN_AT,
            },
          ],
          success: true,
        });
      }
      return json(route, { coin_records: [], success: true });
    }
    case "get_coin_records_by_hint":
    case "get_coin_records_by_names":
      return json(route, { coin_records: [], success: true });
    case "get_xch_balance_by_p2":
      return json(route, xchBalance);
    case "get_cat_balances_by_p2":
      return json(route, catBalances);
    case "get_nft_balance_by_p2":
      return json(route, {
        p2: `0x${P2}`,
        confirmed_balance: "2",
        locked_balance: "0",
        pending_balance: "0",
        pending_locked_balance: "0",
        success: true,
      });
    case "get_transactions_by_p2": {
      const claim = poolClaimFor(
        String(body.p2 ?? "")
          .replace(/^0x/, "")
          .toLowerCase()
      );
      return json(route, claim ? { transactions: [claim], success: true } : blockTransactions);
    }
    case "get_pending_transactions_by_p2": {
      const p2 = String(body.p2 ?? "")
        .replace(/^0x/, "")
        .toLowerCase();
      // A real pending mempool item's id, so the watchlist's queue position lines up with the
      // compact mempool summary (mockSummary) rather than showing "not seen in the mempool yet".
      if (p2 === P2) return json(route, { transactions: [watchedPendingTx()], success: true });
      return json(route, { transactions: [], success: true });
    }
    case "get_transactions_by_cat_asset_id": {
      const assetId = String(body.asset_id ?? "")
        .replace(/^0x/, "")
        .toLowerCase();
      const all = syntheticCatActivity(assetId);
      const ordered = body.order === "asc" ? [...all].reverse() : all;
      const limit = Number(body.limit ?? 50);
      return json(route, {
        transactions: ordered.slice(0, limit),
        truncated: ordered.length > limit,
        next_cursor: ordered.length > limit ? "more" : null,
        success: true,
      });
    }
    case "get_transactions_by_nft_id":
    case "get_transactions_by_coin_name":
      return json(route, { transactions: [], success: true });
    case "get_coin_details":
      return json(route, { success: false, error: "not found" }, 404);
    case "get_singleton_info": {
      const launcher = String(body.launcher_id ?? "").replace(/^0x/, "");
      const vault = PREFARM_SINGLETONS[launcher];
      return json(route, {
        launcher_id: body.launcher_id,
        singleton_type: vault ? "singleton" : null,
        coin_record: vault
          ? {
              coin: {
                parent_coin_info: `0x${hash(0x9f)}`,
                puzzle_hash: `0x${vault.puzzleHash}`,
                amount: Number(vault.amount),
              },
              confirmed_block_index: 8_969_947,
              spent: false,
              spent_block_index: 0,
              coinbase: false,
              timestamp: 1_789_000_000,
            }
          : null,
        success: true,
      });
    }
    case "get_latest_nft_coin_by_nft_id":
      return json(route, { nft_coin_record: null, success: true });
    case "get_offer": {
      const id = String(body.offer_id ?? "").replace(/^0x/, "");
      return id === OFFER_ID
        ? json(route, offerState)
        : json(route, { success: false, error: `Key not found: offer_state/${id}` });
    }
    case "get_offers_by_p2":
    case "get_offers_by_cat_asset_id":
    case "get_offers_by_nft_id": {
      // The recorded page holds two open DBX offers; every other status answers empty.
      const offers = body.status === "open" ? offersByCat.offers : [];
      return json(route, {
        ...offersByCat,
        offers,
        truncated: false,
        next_cursor: undefined,
        status: body.status,
      });
    }
    case "get_clawback_coins_by_receiver":
      return json(route, {
        p2: body.p2,
        clawbacks:
          String(body.p2).replace(/^0x/, "") === P2
            ? [
                {
                  coin_id: `0x${hash(0xc1a)}`,
                  receiver_p2: `0x${P2}`,
                  sender_p2: `0x${hash(0x5e)}`,
                  seconds: 86400,
                  amount: "250000000000",
                  asset_kind: "xch",
                  asset_id: null,
                  revocable: true,
                },
              ]
            : [],
        success: true,
      });
    case "get_reorgs":
      return json(route, reorgs);
    case "get_raw_transaction_by_id": {
      const id = String(body.tx_id ?? "").replace(/^0x/, "");
      return id === TX_ID
        ? json(route, rawTxXch)
        : json(route, { success: false, error: "Transaction not found" });
    }
    case "get_connections":
      // Coinset's public gateway does not expose this (confirmed live: 404); only the mocked
      // custom node answers it, matching real behaviour.
      return url.host === "node.example.test:8556"
        ? json(route, {
            connections: [
              {
                node_id: `0x${hash(1)}`,
                peer_host: "203.0.113.10",
                peer_port: 8444,
                type: 0,
                bytes_read: 204800,
                bytes_written: 51200,
                peak_height: 9300000,
                creation_time: 1_757_000_000,
              },
              {
                node_id: `0x${hash(2)}`,
                peer_host: "203.0.113.20",
                peer_port: 8444,
                type: 0,
                bytes_read: 1024,
                bytes_written: 2048,
                peak_height: 9299998,
                creation_time: 1_757_001_000,
              },
              {
                node_id: `0x${hash(3)}`,
                peer_host: "198.51.100.5",
                peer_port: 8447,
                type: 5,
                bytes_read: 500,
                bytes_written: 500,
                peak_height: null,
                creation_time: 1_757_002_000,
              },
            ],
            success: true,
          })
        : json(route, { success: false, error: "unknown method" }, 404);
    default:
      return json(route, { success: false, error: `unmocked method ${method}` }, 404);
  }
}

/** Record a "Reject all" decision so the consent panel does not cover controls under test. */
export async function seedConsent(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "mempool-xch:consent:v1",
      JSON.stringify({ analytics: false, advertising: false, decidedAt: Date.now() })
    );
  });
}

/** Intercepts every Coinset call; anything unknown answers not found. */
export async function mockCoinset(page: Page, { consent = true }: { consent?: boolean } = {}) {
  if (consent) await seedConsent(page);
  await page.route(/https:\/\/(testnet11\.)?api\.coinset\.org\/.*/, answerNodeMethod);
  // WebSocket: block the upgrade so the app falls back to polling deterministically.
  await page.routeWebSocket(/wss:\/\/.*coinset\.org\/ws.*/, (ws) => ws.close());
  await mockXchTicker(page);
}

/** Gate.io's XCH/USDT ticker, asked by every page that shows a dollar value: $2, up 5 %. */
export async function mockXchTicker(page: Page) {
  await page.route(/https:\/\/api\.gateio\.ws\/api\/v4\/spot\/tickers.*/, (route) =>
    json(route, [{ currency_pair: "XCH_USDT", last: "2", change_percentage: "5" }])
  );
}

function dexieTicker(
  assetId: string,
  price: string,
  d1: string,
  d7: string,
  d30: string,
  book: { bid: string; ask: string; low_30d: string; high_30d: string } | null = null
) {
  return {
    ticker_id: `${assetId}_xch`,
    base_currency: assetId,
    target_currency: "xch",
    last_price: price,
    target_volume: d1,
    target_volume_7d: d7,
    target_volume_30d: d30,
    bid: null,
    ask: null,
    ...book,
  };
}

/** Busy trades every day, quiet only within the month, silent has a price but no trades. */
const DEXIE_TICKERS = [
  dexieTicker(TOKEN_ACTIVE, "0.0125", "42.5", "310", "2210.9", {
    bid: "0.012",
    ask: "0.013",
    low_30d: "0.01",
    high_30d: "0.015",
  }),
  dexieTicker(TOKEN_QUIET, "3.5", "0", "0", "7.25"),
  dexieTicker(TOKEN_SILENT, "0.5", "0", "0", "0"),
];

/** Intercepts the Dexie CAT registry and tickers with a small fixed set (the tokens page). */
export async function mockDexie(page: Page) {
  await page.route(/https:\/\/api\.dexie\.space\/v3\/prices\/tickers.*/, (route) =>
    json(route, { success: true, tickers: DEXIE_TICKERS })
  );
  await page.route(/https:\/\/api\.dexie\.space\/v1\/assets.*/, (route) =>
    json(route, {
      success: true,
      count: DEXIE_ASSETS.length,
      page: 1,
      page_size: 100,
      assets: DEXIE_ASSETS,
    })
  );
  await page.route(/https:\/\/icons\.dexie\.space\/.*/, (route) =>
    route.fulfill({ status: 404, body: "" })
  );
}

export const CUSTOM_NODE_URL = "https://node.example.test:8556";

/** A custom full-node RPC (not Coinset): the app must poll and fetch the mempool itself. */
export async function mockCustomNode(page: Page) {
  await seedConsent(page);
  await page.addInitScript((rpcUrl) => {
    window.localStorage.setItem(
      "mempool-xch:settings:v1",
      JSON.stringify({
        network: "mainnet",
        endpoints: {
          mainnet: { rpcUrl },
          testnet11: { rpcUrl: "https://testnet11.api.coinset.org" },
        },
        theme: "dark",
        recentBlocks: 8,
      })
    );
  }, CUSTOM_NODE_URL);
  await page.route(/https:\/\/node\.example\.test:8556\/.*/, answerNodeMethod);
  // Anything that still goes to Coinset is a bug: answer 599 so the test can see it.
  await page.route(/https:\/\/(testnet11\.)?api\.coinset\.org\/.*/, (route) =>
    route.fulfill({ status: 599, body: "must not be called with a custom node" })
  );
}

export const NODEXCH_URL = "https://nodexch.space";
export const NODEXCH_KEY = "nxp_e2eTestKey0123456789abcdef";

/**
 * The hosted nodexch gateway (Coinset's dialect in front of an own node): RPC and the indexed
 * API on one host, the WebSocket on /ws with the publishable key in its query, peers on
 * /x/node/v1/peers. Every request and socket is recorded, so a spec can check the key and that
 * nothing went to Coinset.
 */
export async function mockNodexch(page: Page) {
  await seedConsent(page);
  await page.addInitScript(
    ({ rpcUrl, apiKey }) => {
      window.localStorage.setItem(
        "mempool-xch:settings:v1",
        JSON.stringify({
          network: "mainnet",
          endpoints: {
            mainnet: { rpcUrl, apiKey },
            testnet11: { rpcUrl: "https://testnet11.api.coinset.org" },
          },
          theme: "dark",
          recentBlocks: 8,
        })
      );
    },
    { rpcUrl: NODEXCH_URL, apiKey: NODEXCH_KEY }
  );
  const seen = {
    requests: [] as { url: string; authorization: string | null }[],
    sockets: [] as string[],
  };
  await page.route(/https:\/\/nodexch\.space\/x\/node\/v1\/peers$/, (route) => {
    seen.requests.push({
      url: route.request().url(),
      authorization: route.request().headers().authorization ?? null,
    });
    return json(route, {
      connections: [
        {
          type: 1,
          peer_host: "203.0.113.0",
          peer_server_port: 8444,
          peak_height: 9295535,
          creation_time: 1700000000,
        },
      ],
      success: true,
    });
  });
  await page.route(/https:\/\/nodexch\.space\/(?!x\/)[a-z_]+$/, (route) => {
    seen.requests.push({
      url: route.request().url(),
      authorization: route.request().headers().authorization ?? null,
    });
    return answerNodeMethod(route);
  });
  // The gateway's frames, in Coinset's shape: a peak right after the upgrade.
  await page.routeWebSocket(/wss:\/\/nodexch\.space\/ws.*/, (ws) => {
    seen.sockets.push(ws.url());
    ws.send(
      JSON.stringify({
        network: "mainnet",
        seq: 1,
        message: { type: "peak", data: { height: 9295535, tx: true } },
      })
    );
  });
  await page.route(/https:\/\/(testnet11\.)?api\.coinset\.org\/.*/, (route) =>
    route.fulfill({ status: 599, body: "must not be called with nodexch" })
  );
  await page.routeWebSocket(/wss:\/\/.*coinset\.org\/ws.*/, (ws) => ws.close());
  return seen;
}
