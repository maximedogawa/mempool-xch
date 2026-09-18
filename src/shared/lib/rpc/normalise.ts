import { toMojos } from "@/shared/lib/chia/amounts";
import { stripHexPrefix } from "@/shared/lib/chia/hex";
import { coinName } from "@/shared/lib/chia/coin";
import type {
  AssetAmounts,
  BlockRecord,
  BlockchainState,
  CatBalance,
  ClawbackCoin,
  ClawbackList,
  Coin,
  CoinDetails,
  CoinRecord,
  CoinSpend,
  FeeEstimate,
  FullBlockSummary,
  MempoolItem,
  OfferList,
  OfferSide,
  OfferState,
  OfferStatus,
  ParticipantFlow,
  PeerConnection,
  RawCoinRef,
  RawTransaction,
  ReorgEvent,
  ReorgList,
  SingletonInfo,
  TxList,
  TxSummary,
  TxSummaryEvent,
  TxSummaryKind,
  XchBalance,
} from "./types";
import { OFFER_STATUSES } from "./types";

type Raw = Record<string, unknown>;
const asRaw = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0): number => {
  if (typeof v === "number") return v;
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "string" && v !== "") return Number(v);
  return fallback;
};
const big = (v: unknown): bigint => {
  if (typeof v === "bigint") return v;
  if (typeof v === "number" || typeof v === "string") return toMojos(v);
  return 0n;
};
const hex = (v: unknown): string => stripHexPrefix(str(v));
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const nullableNum = (v: unknown): number | null => (v === null || v === undefined ? null : num(v));

export function normaliseCoin(raw: unknown): Coin {
  const r = asRaw(raw);
  return {
    parentCoinInfo: hex(r.parent_coin_info),
    puzzleHash: hex(r.puzzle_hash),
    amount: big(r.amount),
  };
}

export function normaliseCoinRecord(raw: unknown): CoinRecord {
  const r = asRaw(raw);
  const coin = normaliseCoin(r.coin);
  return {
    coin,
    name: coinName(coin),
    coinbase: Boolean(r.coinbase),
    confirmedBlockIndex: num(r.confirmed_block_index),
    spent: Boolean(r.spent),
    spentBlockIndex: num(r.spent_block_index),
    timestamp: num(r.timestamp),
  };
}

export function normaliseCoinSpend(raw: unknown): CoinSpend {
  const r = asRaw(raw);
  return {
    coin: normaliseCoin(r.coin),
    puzzleReveal: str(r.puzzle_reveal),
    solution: str(r.solution),
  };
}

export function normaliseMempoolItem(raw: unknown): MempoolItem {
  const r = asRaw(raw);
  const sb = asRaw(r.spend_bundle);
  return {
    name: hex(r.spend_bundle_name),
    fee: big(r.fee),
    cost: num(r.cost),
    additions: arr(r.additions).map(normaliseCoin),
    removals: arr(r.removals).map(normaliseCoin),
    spendBundle: {
      aggregatedSignature: str(sb.aggregated_signature),
      coinSpends: arr(sb.coin_spends).map(normaliseCoinSpend),
    },
  };
}

export function normaliseBlockRecord(raw: unknown): BlockRecord {
  const r = asRaw(raw);
  const timestamp = nullableNum(r.timestamp);
  return {
    height: num(r.height),
    headerHash: hex(r.header_hash),
    prevHash: hex(r.prev_hash),
    weight: big(r.weight),
    totalIters: big(r.total_iters),
    timestamp,
    fees: r.fees === null || r.fees === undefined ? null : big(r.fees),
    farmerPuzzleHash: hex(r.farmer_puzzle_hash),
    poolPuzzleHash: hex(r.pool_puzzle_hash),
    prevTransactionBlockHash: r.prev_transaction_block_hash
      ? hex(r.prev_transaction_block_hash)
      : null,
    prevTransactionBlockHeight: num(r.prev_transaction_block_height),
    rewardClaimsIncorporated: Array.isArray(r.reward_claims_incorporated)
      ? r.reward_claims_incorporated.map(normaliseCoin)
      : null,
    overflow: Boolean(r.overflow),
    signagePointIndex: num(r.signage_point_index),
    deficit: num(r.deficit),
    subEpochSummaryIncluded:
      r.sub_epoch_summary_included !== null && r.sub_epoch_summary_included !== undefined,
    isTransactionBlock: timestamp !== null,
  };
}

export function normaliseFullBlock(raw: unknown): FullBlockSummary {
  const r = asRaw(raw);
  const ftb = r.foliage_transaction_block ? asRaw(r.foliage_transaction_block) : null;
  const info = r.transactions_info ? asRaw(r.transactions_info) : null;
  const rewardChain = asRaw(r.reward_chain_block);
  // Coinset leaves transactions_generator out of get_block, so a non-zero generator root (or
  // any cost) is the reliable sign that the block carries spends.
  const generator = str(r.transactions_generator);
  const generatorRoot = info ? str(info.generator_root).replace(/^0x/, "") : "";
  const hasGenerator =
    generator.length > 2 || /[1-9a-f]/i.test(generatorRoot) || (info ? num(info.cost) > 0 : false);
  return {
    headerHash: hex(r.header_hash),
    height: num(rewardChain.height),
    isTransactionBlock: ftb !== null,
    timestamp: ftb ? num(ftb.timestamp) : null,
    cost: info ? num(info.cost) : 0,
    fees: info ? big(info.fees) : 0n,
    rewardClaimsIncorporated: info ? arr(info.reward_claims_incorporated).map(normaliseCoin) : [],
    hasGenerator,
    prevTransactionBlockHash: ftb ? hex(ftb.prev_transaction_block_hash) : null,
  };
}

export function normaliseBlockchainState(raw: unknown): BlockchainState {
  const r = asRaw(raw);
  const sync = asRaw(r.sync);
  const minFees = asRaw(r.mempool_min_fees);
  return {
    peak: normaliseBlockRecord(r.peak),
    space: big(r.space),
    difficulty: num(r.difficulty),
    subSlotIters: num(r.sub_slot_iters),
    averageBlockTime: num(r.average_block_time, 18.75),
    blockMaxCost: num(r.block_max_cost, 11_000_000_000),
    mempoolSize: num(r.mempool_size),
    mempoolCost: num(r.mempool_cost),
    mempoolFees: big(r.mempool_fees),
    mempoolMaxTotalCost: num(r.mempool_max_total_cost, 110_000_000_000),
    mempoolMinFees: Object.fromEntries(Object.entries(minFees).map(([k, v]) => [k, num(v)])),
    synced: sync.synced === undefined ? true : Boolean(sync.synced),
    nodeId: hex(r.node_id),
  };
}

export function normaliseFeeEstimate(raw: unknown): FeeEstimate {
  const r = asRaw(raw);
  return {
    targetTimes: arr(r.target_times).map((v) => num(v)),
    estimates: arr(r.estimates).map((v) => big(v)),
    currentFeeRate: num(r.current_fee_rate),
    feeRateLastBlock: num(r.fee_rate_last_block),
    feesLastBlock: big(r.fees_last_block),
    lastBlockCost: num(r.last_block_cost),
    lastTxBlockHeight: num(r.last_tx_block_height),
    peakHeight: num(r.peak_height),
    mempoolCost: num(r.mempool_size),
    mempoolMaxCost: num(r.mempool_max_size),
    mempoolFees: big(r.mempool_fees),
    numSpends: num(r.num_spends),
    nodeTimeUtc: num(r.node_time_utc),
    synced: r.full_node_synced === undefined ? true : Boolean(r.full_node_synced),
  };
}

/* ---- Coinset indexed API ---- */

function normaliseAssetAmounts(raw: unknown): AssetAmounts {
  const r = asRaw(raw);
  return {
    xch: big(r.xch),
    cats: arr(r.cats).map((c) => ({
      assetId: hex(asRaw(c).asset_id),
      amount: big(asRaw(c).amount),
    })),
    nfts: arr(r.nfts).map((n) => hex(n)),
  };
}

function normaliseParticipant(raw: unknown): ParticipantFlow {
  const r = asRaw(raw);
  return {
    p2: hex(r.p2),
    sent: normaliseAssetAmounts(r.sent),
    received: normaliseAssetAmounts(r.received),
  };
}

function normaliseRawCoinRef(raw: unknown): RawCoinRef {
  const r = asRaw(raw);
  const ct = r.coin_type ? asRaw(r.coin_type) : null;
  return {
    coinId: hex(r.coin_id),
    puzzleHash: hex(r.puzzle_hash),
    amount: big(r.amount),
    outerPuzzleType: ct ? str(ct.outer_puzzle_type) : undefined,
    custodyPuzzleType: ct ? str(ct.custody_puzzle_type) : undefined,
    custodyP2: ct ? hex(ct.custody_p2) : undefined,
    assetId: ct && ct.asset_id ? hex(ct.asset_id) : undefined,
  };
}

function normaliseEvent(raw: unknown): TxSummaryEvent {
  const r = asRaw(raw);
  return {
    type: str(r.type, "Unknown"),
    feeMojos: big(r.fee_mojos),
    participants: arr(r.participants).map(normaliseParticipant),
    inputs: arr(r.inputs).map(normaliseRawCoinRef),
    outputs: arr(r.outputs).map(normaliseRawCoinRef),
    memos: arr(r.memos).map((m) => hex(m)),
    raw: r,
  };
}

const KIND_PRECEDENCE: TxSummaryKind[] = [
  "swap",
  "mint",
  "melt",
  "revoke",
  "clawback",
  "pool",
  "combine",
  "split",
  "transfer",
  "unknown",
];

/** Primary kind as Coinset documents it: swap > mint > melt > combine > split > transfer > unknown. */
export function deriveKind(events: TxSummaryEvent[]): TxSummaryKind {
  const kinds = new Set(events.map((e) => e.type.toLowerCase()));
  return KIND_PRECEDENCE.find((k) => kinds.has(k)) ?? "unknown";
}

export function normaliseTxSummary(raw: unknown): TxSummary {
  const r = asRaw(raw);
  const events = arr(r.events).map(normaliseEvent);
  const status = str(r.status, "confirmed");
  return {
    id: hex(r.id),
    source: r.source === "inferred" ? "inferred" : "mempool",
    status: status === "pending" || status === "removed" ? status : "confirmed",
    cost: num(r.cost),
    feeMojos: big(r.fee_mojos),
    firstSeenMs: nullableNum(r.first_seen_ms),
    confirmedHeight: nullableNum(r.confirmed_height),
    confirmedHeaderHash: r.confirmed_header_hash ? hex(r.confirmed_header_hash) : null,
    confirmedAtMs: nullableNum(r.confirmed_at_ms),
    removedAtMs: nullableNum(r.removed_at_ms),
    lastUpdatedMs: num(r.last_updated_ms),
    events,
    kind: deriveKind(events),
  };
}

export function normaliseTxList(raw: unknown): TxList {
  const r = asRaw(raw);
  return {
    transactions: arr(r.transactions).map(normaliseTxSummary),
    truncated: Boolean(r.truncated),
    nextCursor: typeof r.next_cursor === "string" && r.next_cursor !== "" ? r.next_cursor : null,
  };
}

export function normaliseXchBalance(raw: unknown): XchBalance {
  const r = asRaw(raw);
  return {
    p2: hex(r.p2),
    confirmed: big(r.confirmed_balance),
    locked: big(r.locked_balance),
    pending: big(r.pending_balance),
    pendingLocked: big(r.pending_locked_balance),
  };
}

export function normaliseCatBalances(raw: unknown): CatBalance[] {
  const r = asRaw(raw);
  return arr(r.balances).map((b) => {
    const x = asRaw(b);
    return {
      assetId: hex(x.cat_asset_id),
      confirmed: big(x.confirmed_balance),
      pending: big(x.pending_balance),
      locked: big(x.locked_balance),
    };
  });
}

export function normaliseCoinDetails(raw: unknown): CoinDetails {
  const r = asRaw(raw);
  return {
    coinName: hex(r.coin_name),
    coinRecord: r.coin_record ? normaliseCoinRecord(r.coin_record) : null,
    semantics: r.semantics ? asRaw(r.semantics) : null,
    createdInTxId: r.created_in_tx_id ? hex(r.created_in_tx_id) : null,
    spentInTxId: r.spent_in_tx_id ? hex(r.spent_in_tx_id) : null,
    createdTransaction: r.created_transaction ? normaliseTxSummary(r.created_transaction) : null,
    spentTransaction: r.spent_transaction ? normaliseTxSummary(r.spent_transaction) : null,
  };
}

export function normaliseSingletonInfo(raw: unknown): SingletonInfo {
  const r = asRaw(raw);
  return {
    launcherId: hex(r.launcher_id),
    singletonType: r.singleton_type ? str(r.singleton_type) : null,
    coinRecord: r.coin_record ? asRaw(r.coin_record) : null,
  };
}

export function normalisePeerConnection(raw: unknown): PeerConnection {
  const r = asRaw(raw);
  return {
    nodeId: hex(r.node_id),
    peerHost: str(r.peer_host),
    peerPort: num(r.peer_port),
    type: num(r.type),
    bytesRead: num(r.bytes_read),
    bytesWritten: num(r.bytes_written),
    peakHeight: nullableNum(r.peak_height),
    creationTimeS: nullableNum(r.creation_time),
  };
}

/* ---- Coinset offers, clawbacks, reorgs, raw transactions ---- */

const nullableHex = (v: unknown): string | null => (typeof v === "string" && v ? hex(v) : null);

function normaliseOfferSide(
  assetIds: unknown,
  xchMojos: unknown,
  catMojos: unknown,
  nftIds: unknown
): OfferSide {
  const cats = asRaw(catMojos);
  const ids = arr(assetIds).map(hex);
  return {
    xch: big(xchMojos),
    cats: ids.map((assetId) => ({ assetId, amount: big(cats[assetId] ?? cats[`0x${assetId}`]) })),
    nfts: arr(nftIds).map(hex),
  };
}

export function normaliseOfferState(raw: unknown): OfferState {
  const r = asRaw(raw);
  const status = str(r.status, "open");
  return {
    offerId: hex(r.offer_id),
    status: (OFFER_STATUSES as readonly string[]).includes(status)
      ? (status as OfferStatus)
      : "open",
    firstSeenMs: num(r.first_seen_ms),
    lastUpdatedMs: num(r.last_updated_ms),
    makerP2s: arr(r.maker_p2s).map(hex),
    offered: normaliseOfferSide(
      r.offered_cat_asset_ids,
      r.offered_xch_mojos,
      r.offered_cat_mojos,
      r.offered_nft_ids
    ),
    requested: normaliseOfferSide(
      r.requested_cat_asset_ids,
      r.requested_xch_mojos,
      r.requested_cat_mojos,
      r.requested_nft_ids
    ),
    feeMojos: big(r.fee_mojos),
    expiresBeforeHeight: nullableNum(r.expires_before_height),
    expiresBeforeTimeMs: nullableNum(r.expires_before_time_ms),
    pendingTxId: nullableHex(r.pending_tx_id),
    confirmedTxId: nullableHex(r.confirmed_tx_id),
    confirmedHeight: nullableNum(r.confirmed_height),
    confirmedAtMs: nullableNum(r.confirmed_at_ms),
    cancelledByTxId: nullableHex(r.cancelled_by_tx_id),
    cancelledHeight: nullableNum(r.cancelled_height),
    cancelledAtMs: nullableNum(r.cancelled_at_ms),
    expiredAtHeight: nullableNum(r.expired_at_height),
  };
}

export function normaliseOfferList(raw: unknown): OfferList {
  const r = asRaw(raw);
  return {
    offers: arr(r.offers).map(normaliseOfferState),
    truncated: Boolean(r.truncated),
    nextCursor: typeof r.next_cursor === "string" ? r.next_cursor : null,
  };
}

export function normaliseClawbackList(raw: unknown): ClawbackList {
  const r = asRaw(raw);
  const clawbacks = arr(r.clawbacks).map((c): ClawbackCoin => {
    const x = asRaw(c);
    const kind = str(x.asset_kind, "xch");
    return {
      coinId: hex(x.coin_id),
      receiverP2: hex(x.receiver_p2),
      senderP2: hex(x.sender_p2),
      seconds: num(x.seconds),
      amount: big(x.amount),
      assetKind: kind === "cat" || kind === "nft" ? kind : "xch",
      assetId: nullableHex(x.asset_id),
      revocable: Boolean(x.revocable),
    };
  });
  return {
    clawbacks,
    truncated: Boolean(r.truncated),
    nextCursor: typeof r.next_cursor === "string" ? r.next_cursor : null,
  };
}

export function normaliseReorgEvent(raw: unknown): ReorgEvent {
  const r = asRaw(raw);
  return {
    id: str(r.id),
    detectedAtMs: num(r.detected_at_ms),
    oldPeakHeight: num(r.old_peak_height),
    oldPeakHash: hex(r.old_peak_hash),
    newPeakHeight: num(r.new_peak_height),
    newPeakHash: hex(r.new_peak_hash),
    depth: num(r.reorg_depth, Math.max(0, num(r.old_peak_height) - num(r.new_peak_height))),
  };
}

export function normaliseReorgList(raw: unknown): ReorgList {
  const r = asRaw(raw);
  return {
    reorgs: arr(r.reorgs).map(normaliseReorgEvent),
    truncated: Boolean(r.truncated),
    nextCursor: typeof r.next_cursor === "string" ? r.next_cursor : null,
  };
}

export function normaliseRawTransaction(raw: unknown): RawTransaction {
  const r = asRaw(raw);
  return {
    source: r.source === "inferred" ? "inferred" : "mempool",
    item: normaliseMempoolItem(r.item),
  };
}
