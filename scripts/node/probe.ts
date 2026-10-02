/**
 * Calls every full-node RPC method mempoolxch.space uses against one endpoint, through the
 * app's own RPC client (so its parsing is exercised too), and prints what works:
 *
 *   bun run node:probe                         the dev proxy at http://127.0.0.1:8556
 *   bun run node:probe https://node.example:8556
 *
 * Parameters come from the node itself: its peak, the newest transaction block it has, a coin
 * that block created and one it spent. push_tx is never called (it would broadcast), and the
 * Coinset-only methods are listed as unavailable on a plain node. Exit code 1 when a standard
 * method fails.
 */
import { formatTable, summarise, type ProbeRow } from "../../src/shared/lib/node/probeReport";
import { COINSET_ONLY_METHODS } from "../../src/shared/lib/node/methods";
import { createRpcClient } from "../../src/shared/lib/rpc/client";
import { coinName } from "../../src/shared/lib/chia/coin";
import type { BlockRecord, CoinRecord } from "../../src/shared/lib/rpc/types";

const url = (process.argv[2] ?? "http://127.0.0.1:8556").replace(/\/+$/, "");
const client = createRpcClient({ rpcUrl: url, indexedUrl: null, timeoutMs: 30_000 });
const rows: ProbeRow[] = [];

/** Runs one call, records ok or error with its latency, and returns the value (or null). */
async function call<T>(method: string, run: () => Promise<T>, note: (v: T) => string) {
  const started = performance.now();
  try {
    const value = await run();
    rows.push({
      method,
      status: "ok",
      ms: Math.round(performance.now() - started),
      note: note(value),
    });
    return value;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    rows.push({
      method,
      status: "error",
      ms: Math.round(performance.now() - started),
      note: reason,
    });
    return null;
  }
}

const skip = (method: string, note: string) =>
  rows.push({ method, status: "skipped", ms: null, note });
const fmt = (n: number) => n.toLocaleString("en-US");

const state = await call(
  "get_blockchain_state",
  () => client.getBlockchainState(),
  (s) =>
    s.synced
      ? `peak ${fmt(s.peak.height)} · synced`
      : `peak ${fmt(s.peak.height)} · syncing${s.syncTipHeight ? ` toward ${fmt(s.syncTipHeight)}` : ""}`
);
if (!state) {
  console.log(formatTable(rows));
  console.error(`\nNo blockchain state from ${url}: is the node (and the dev proxy) running?`);
  process.exit(1);
}
const peak = state.peak.height;

await call(
  "get_network_space",
  async () => {
    const older = await client.getBlockRecordByHeight(Math.max(0, peak - 1000));
    return client.getNetworkSpace(older.headerHash, state.peak.headerHash);
  },
  (space) => `${(Number(space) / 2 ** 60).toFixed(2)} EiB`
);

await call(
  "get_fee_estimate",
  () => client.getFeeEstimate(6_000_000, [60, 300, 600]),
  (f) => `${f.estimates.map(String).join(" / ")} mojo for 60/300/600 s`
);

await call(
  "get_block_record_by_height",
  () => client.getBlockRecordByHeight(peak),
  (r) => `#${fmt(r.height)} ${r.headerHash.slice(0, 12)}…`
);
await call(
  "get_block_record",
  () => client.getBlockRecord(state.peak.headerHash),
  (r) => `#${fmt(r.height)}`
);
const records = await call(
  "get_block_records",
  () => client.getBlockRecords(Math.max(0, peak - 40), peak + 1),
  (r) => `${r.length} records`
);

// The newest transaction block the node has, for the block and coin calls.
const txBlock: BlockRecord | undefined = [...(records ?? [])]
  .reverse()
  .find((r) => r.isTransactionBlock);

let created: CoinRecord | undefined;
let spent: CoinRecord | undefined;
if (!txBlock) {
  for (const m of ["get_block", "get_additions_and_removals", "get_block_spends"]) {
    skip(m, "no transaction block in the last 40 blocks");
  }
} else {
  await call(
    "get_block",
    () => client.getBlock(txBlock.headerHash),
    () => `#${fmt(txBlock.height)}`
  );
  const ar = await call(
    "get_additions_and_removals",
    () => client.getAdditionsAndRemovals(txBlock.headerHash),
    (v) => `${v.additions.length} additions, ${v.removals.length} removals`
  );
  created = ar?.additions.find((c) => !c.coinbase) ?? ar?.additions[0];
  spent = ar?.removals[0];
  const spends = await call(
    "get_block_spends",
    () => client.getBlockSpends(txBlock.headerHash),
    (s) => `${s.length} spends`
  );
  // A syncing node may never answer get_additions_and_removals; the block's spends still name
  // coins it spent, which is enough to exercise the coin calls.
  const fromSpend = spends?.[0]?.coin;
  if (fromSpend && (!created || !spent)) {
    const record: CoinRecord = {
      coin: fromSpend,
      name: coinName(fromSpend),
      coinbase: false,
      confirmedBlockIndex: 0,
      spent: true,
      spentBlockIndex: txBlock.height,
      timestamp: 0,
    };
    created ??= record;
    spent ??= record;
  }
}

if (!created) {
  for (const m of [
    "get_coin_record_by_name",
    "get_coin_records_by_names",
    "get_coin_records_by_parent_ids",
    "get_coin_records_by_puzzle_hash",
    "get_coin_records_by_hint",
    "get_mempool_items_by_coin_name",
  ]) {
    skip(m, "no coin to ask for");
  }
} else {
  const coin = created;
  await call(
    "get_coin_record_by_name",
    () => client.getCoinRecordByName(coin.name),
    (r) => `confirmed at #${fmt(r.confirmedBlockIndex)}`
  );
  await call(
    "get_coin_records_by_names",
    () => client.getCoinRecordsByNames([coin.name]),
    (r) => `${r.length} record`
  );
  await call(
    "get_coin_records_by_parent_ids",
    () => client.getCoinRecordsByParentIds([coin.coin.parentCoinInfo]),
    (r) => `${r.length} records`
  );
  await call(
    "get_coin_records_by_puzzle_hash",
    () => client.getCoinRecordsByPuzzleHash(coin.coin.puzzleHash),
    (r) => `${r.length} records`
  );
  await call(
    "get_coin_records_by_hint",
    () => client.getCoinRecordsByHint(coin.coin.puzzleHash),
    (r) => `${r.length} records`
  );
  await call(
    "get_mempool_items_by_coin_name",
    () => client.getMempoolItemsByCoinName(coin.name),
    (r) => `${r.length} items`
  );
}

if (spent) {
  const coin = spent;
  await call(
    "get_puzzle_and_solution",
    () => client.getPuzzleAndSolution(coin.name, coin.spentBlockIndex),
    () => `spend at #${fmt(coin.spentBlockIndex)}`
  );
} else {
  skip("get_puzzle_and_solution", "no spent coin in the block");
}

const ids = await call(
  "get_all_mempool_tx_ids",
  () => client.getAllMempoolTxIds(),
  (v) => `${v.length} bundles`
);
await call(
  "get_all_mempool_items",
  () => client.getAllMempoolItems(),
  (v) => `${v.length} items`
);
if (ids && ids.length > 0) {
  await call(
    "get_mempool_item_by_tx_id",
    () => client.getMempoolItemByTxId(ids[0]!),
    () => `${ids[0]!.slice(0, 12)}…`
  );
} else {
  skip("get_mempool_item_by_tx_id", "mempool empty");
}
await call(
  "get_connections",
  () => client.getConnections(),
  (v) => `${v.length} peers`
);
skip("push_tx", "not called: it would broadcast a transaction");

for (const method of COINSET_ONLY_METHODS) {
  rows.push({ method, status: "expected-unavailable", ms: null, note: "Coinset indexed API only" });
}

console.log(`Probe of ${url}\n`);
console.log(formatTable(rows));
process.exit(summarise(rows).healthy ? 0 : 1);
