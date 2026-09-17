/**
 * Domain models normalised from the Chia full-node RPC and the Coinset indexed API.
 * Amounts are bigint mojos; ids are lowercase hex without a 0x prefix.
 */
import type { Mojos } from "@/shared/lib/chia/amounts";

export interface Coin {
  parentCoinInfo: string;
  puzzleHash: string;
  amount: Mojos;
}

export interface CoinRecord {
  coin: Coin;
  /** sha256(parent, puzzle hash, amount) computed client-side. */
  name: string;
  coinbase: boolean;
  confirmedBlockIndex: number;
  spent: boolean;
  spentBlockIndex: number;
  timestamp: number;
}

export interface CoinSpend {
  coin: Coin;
  puzzleReveal: string;
  solution: string;
}

export interface SpendBundle {
  aggregatedSignature: string;
  coinSpends: CoinSpend[];
}

export interface MempoolItem {
  /** Spend bundle name (tx id). */
  name: string;
  fee: Mojos;
  cost: number;
  additions: Coin[];
  removals: Coin[];
  spendBundle: SpendBundle;
}

export interface BlockRecord {
  height: number;
  headerHash: string;
  prevHash: string;
  weight: bigint;
  totalIters: bigint;
  /** Present only on transaction blocks. */
  timestamp: number | null;
  fees: Mojos | null;
  farmerPuzzleHash: string;
  poolPuzzleHash: string;
  prevTransactionBlockHash: string | null;
  prevTransactionBlockHeight: number;
  rewardClaimsIncorporated: Coin[] | null;
  overflow: boolean;
  signagePointIndex: number;
  /** Blocks left before the reward chain's challenge can be infused (0 to 16). */
  deficit: number;
  /** True when this block carries a sub-epoch summary. */
  subEpochSummaryIncluded: boolean;
  isTransactionBlock: boolean;
}

export interface FullBlockSummary {
  headerHash: string;
  height: number;
  isTransactionBlock: boolean;
  timestamp: number | null;
  cost: number;
  fees: Mojos;
  rewardClaimsIncorporated: Coin[];
  hasGenerator: boolean;
  prevTransactionBlockHash: string | null;
}

export interface BlockchainState {
  peak: BlockRecord;
  space: bigint;
  difficulty: number;
  subSlotIters: number;
  averageBlockTime: number;
  blockMaxCost: number;
  mempoolSize: number;
  mempoolCost: number;
  mempoolFees: Mojos;
  mempoolMaxTotalCost: number;
  /** Minimum fee per tier keyed by cost bucket, e.g. cost_5000000 → mojos. */
  mempoolMinFees: Record<string, number>;
  synced: boolean;
  nodeId: string;
}

export interface FeeEstimate {
  targetTimes: number[];
  /** Mojos per target, aligned with targetTimes, for the requested cost. */
  estimates: Mojos[];
  currentFeeRate: number;
  feeRateLastBlock: number;
  feesLastBlock: Mojos;
  lastBlockCost: number;
  lastTxBlockHeight: number;
  peakHeight: number;
  /** Total CLVM cost in the mempool (the RPC field is named mempool_size but holds cost). */
  mempoolCost: number;
  /** Mempool capacity in cost. */
  mempoolMaxCost: number;
  mempoolFees: Mojos;
  numSpends: number;
  nodeTimeUtc: number;
  synced: boolean;
}

/* ---- Coinset indexed API ---- */

export type TxStatus = "pending" | "confirmed" | "removed";
export type TxSummaryKind =
  | "swap"
  | "mint"
  | "melt"
  | "combine"
  | "split"
  | "transfer"
  | "pool"
  | "revoke"
  | "clawback"
  | "unknown";

export interface AssetAmounts {
  xch: Mojos;
  cats: { assetId: string; amount: Mojos }[];
  nfts: string[];
}

export interface ParticipantFlow {
  p2: string;
  sent: AssetAmounts;
  received: AssetAmounts;
}

export interface RawCoinRef {
  coinId: string;
  puzzleHash: string;
  amount: Mojos;
  outerPuzzleType?: string;
  custodyPuzzleType?: string;
  custodyP2?: string;
  assetId?: string;
}

export interface TxSummaryEvent {
  type: string;
  feeMojos: Mojos;
  participants: ParticipantFlow[];
  inputs: RawCoinRef[];
  outputs: RawCoinRef[];
  memos: string[];
  /** Untouched event payload for kind-specific rendering (swap legs, minted asset, ...). */
  raw: Record<string, unknown>;
}

export interface TxSummary {
  id: string;
  source: "mempool" | "inferred";
  status: TxStatus;
  cost: number;
  feeMojos: Mojos;
  firstSeenMs: number | null;
  confirmedHeight: number | null;
  confirmedHeaderHash: string | null;
  confirmedAtMs: number | null;
  removedAtMs: number | null;
  lastUpdatedMs: number;
  events: TxSummaryEvent[];
  kind: TxSummaryKind;
}

export interface TxList {
  transactions: TxSummary[];
  truncated: boolean;
  nextCursor: string | null;
}

export interface XchBalance {
  p2: string;
  confirmed: Mojos;
  locked: Mojos;
  pending: Mojos;
  pendingLocked: Mojos;
}

export interface CatBalance {
  assetId: string;
  confirmed: Mojos;
  pending: Mojos;
  locked: Mojos;
}

export interface CoinDetails {
  coinName: string;
  coinRecord: CoinRecord | null;
  semantics: Record<string, unknown> | null;
  createdInTxId: string | null;
  spentInTxId: string | null;
  createdTransaction: TxSummary | null;
  spentTransaction: TxSummary | null;
}

export interface SingletonInfo {
  launcherId: string;
  singletonType: string | null;
  coinRecord: Record<string, unknown> | null;
}

/** One entry from a full node's get_connections: Coinset's public gateway disables it. */
export interface PeerConnection {
  nodeId: string;
  peerHost: string;
  peerPort: number;
  /** Chia's connection type: 0 full node, 1 harvester, 2 farmer, 3 timelord, 4 introducer, 5 wallet. */
  type: number;
  bytesRead: number;
  bytesWritten: number;
  peakHeight: number | null;
  creationTimeS: number | null;
}
