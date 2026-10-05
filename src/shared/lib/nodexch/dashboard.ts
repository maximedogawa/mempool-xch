/**
 * What a nodexch gateway hands an explorer from its loop's memory, in the app's shapes: the
 * dashboard start call `GET /x/node/v1/dashboard` (nodexch TASK-152: the blockchain state, the
 * fee estimate, the recent blocks with the node's records and their asset totals, the mempool
 * items), a `block` frame's asset totals (TASK-150) and a `fees` frame (TASK-153). One request
 * replaces the state, fee, records, mempool and per-block totals calls of a first load, and the
 * frames then keep every one of them current without a call.
 */
import type { BlockAssetTotals } from "@/shared/lib/blocks/assetTotals";
import { compactAllFromGateway } from "@/shared/lib/mempool/gatewayItem";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import { normaliseBlockRecord, normaliseBlockchainState } from "@/shared/lib/rpc/normalise";
import type { BlockRecord, BlockchainState, FeeEstimate } from "@/shared/lib/rpc/types";

type Raw = Record<string, unknown>;

const asRaw = (v: unknown): Raw | null => (v && typeof v === "object" ? (v as Raw) : null);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const count = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
/** Mojos as decimal digits, whether they came as a number, a bigint or a string. */
const digits = (v: unknown) => {
  const text = typeof v === "bigint" || typeof v === "number" ? v.toString() : String(v ?? "");
  return /^\d+$/.test(text) ? text : "0";
};
const hex = (v: unknown) =>
  String(v ?? "")
    .replace(/^0x/, "")
    .toLowerCase();

/** One target of the gateway's estimate: within `blocks` transaction blocks at `feePerCost`. */
export interface FeeQuoteTarget {
  blocks: number;
  feePerCost: number;
}

/** The gateway's fee estimate (`/x/node/v1/fees`, the `fees` frame, the dashboard's `fees`). */
export interface FeeQuote {
  targets: FeeQuoteTarget[];
  minFeePerCost: number;
}

/** A transaction block's totals as the gateway gives them, ready for the cubes' cache. */
export interface GatewayBlockTotals {
  height: number;
  hash: string;
  totals: BlockAssetTotals;
}

export interface GatewayDashboard {
  state: BlockchainState;
  /** The records the gateway carried, newest first (a block whose record it lacked is left out). */
  records: BlockRecord[];
  /** The transaction blocks whose spends the loop read. */
  totals: GatewayBlockTotals[];
  mempool: {
    size: number;
    /** Null when an entry came without its details: the mempool is then read item by item. */
    items: CompactMempoolItem[] | null;
  };
  fees: FeeQuote | null;
}

/** Seconds per transaction block the gateway's targets stand for (1, 3 and 10 blocks). */
export const GATEWAY_SECONDS_PER_BLOCK = 60;

export function parseFeeQuote(raw: unknown): FeeQuote | null {
  const r = asRaw(raw);
  if (!r || !Array.isArray(r.estimates)) return null;
  const targets: FeeQuoteTarget[] = [];
  for (const entry of r.estimates) {
    const e = asRaw(entry);
    if (!e || typeof e.blocks !== "number" || typeof e.fee_per_cost !== "number") return null;
    targets.push({ blocks: e.blocks, feePerCost: e.fee_per_cost });
  }
  if (targets.length === 0) return null;
  return { targets, minFeePerCost: count(r.min_fee_per_cost) };
}

/**
 * The gateway's quote as the fee hooks' estimate for a transaction of `cost`: the fee for each
 * target is its rate times the cost, never below the node's minimum. The node's own figures
 * for the last block and its current rate are not in a quote: `null`, and the cards leave that
 * line out. The mempool figures come from `state` when it is known.
 */
export function feeEstimateFromQuote(
  quote: FeeQuote,
  cost: number,
  state: BlockchainState | null
): FeeEstimate {
  return {
    targetTimes: quote.targets.map((t) => t.blocks * GATEWAY_SECONDS_PER_BLOCK),
    estimates: quote.targets.map((t) =>
      BigInt(Math.max(0, Math.round(Math.max(t.feePerCost, quote.minFeePerCost) * cost)))
    ),
    currentFeeRate: null,
    feeRateLastBlock: null,
    feesLastBlock: null,
    lastBlockCost: null,
    lastTxBlockHeight: state
      ? state.peak.isTransactionBlock
        ? state.peak.height
        : state.peak.prevTransactionBlockHeight
      : 0,
    peakHeight: state?.peak.height ?? 0,
    mempoolCost: state?.mempoolCost ?? 0,
    mempoolMaxCost: state?.mempoolMaxTotalCost ?? 0,
    mempoolFees: state?.mempoolFees ?? 0n,
    numSpends: null,
    nodeTimeUtc: Math.floor(Date.now() / 1000),
    synced: state?.synced ?? true,
  };
}

/**
 * A transaction block's asset totals from a `block` frame's `data` or a dashboard block
 * (`spends` and `assets`, nodexch TASK-150), summed as the gateway does from the coins the block
 * spends, change included: the same figure as this app's own `assetTotalsFromSpends`. Null
 * when the frame carries none (a block the loop did not read, or a non-transaction block).
 */
export function blockTotalsFromFrame(data: unknown): BlockAssetTotals | null {
  const d = asRaw(data);
  const assets = d ? asRaw(d.assets) : null;
  if (!d || !assets || typeof d.spends !== "number") return null;
  return {
    xch: digits(assets.xch),
    cats: list(assets.cats).map((cat) => {
      const c = asRaw(cat) ?? {};
      return { assetId: c.asset_id ? hex(c.asset_id) : "unknown", amount: digits(c.amount) };
    }),
    nfts: count(assets.nfts),
    dids: count(assets.dids),
    singletons: count(assets.singletons),
    source: "gateway",
    count: d.spends,
    partial: false,
  };
}

/** The answer of `GET /x/node/v1/dashboard`; null when it is not one (an older gateway's 404 page). */
export function parseDashboard(raw: unknown): GatewayDashboard | null {
  const r = asRaw(raw);
  const stateRaw = r ? asRaw(r.blockchain_state) : null;
  const mempool = r ? asRaw(r.mempool) : null;
  if (!r || !stateRaw || !mempool || !Array.isArray(r.blocks)) return null;
  const records: BlockRecord[] = [];
  const totals: GatewayBlockTotals[] = [];
  for (const entry of r.blocks) {
    const block = asRaw(entry);
    if (!block) continue;
    const recordRaw = asRaw(block.record);
    if (recordRaw) {
      const record = normaliseBlockRecord(recordRaw);
      if (Number.isFinite(record.height) && record.headerHash) records.push(record);
    }
    const blockTotals = blockTotalsFromFrame(block);
    const hash = hex(block.header_hash);
    if (blockTotals && typeof block.height === "number" && hash)
      totals.push({ height: block.height, hash, totals: blockTotals });
  }
  records.sort((a, b) => b.height - a.height);
  return {
    state: normaliseBlockchainState(stateRaw),
    records,
    totals,
    mempool: { size: count(mempool.size), items: compactAllFromGateway(mempool.items) },
    fees: parseFeeQuote(r.fees),
  };
}
