/**
 * Shapes shared by the server-side chain cache (src/server/chainCache.ts) and the browser hooks
 * that read it from /api/<network>/chain (decision-006, TASK-034).
 */
import type { NetworkId } from "@/shared/config/networks";
import type { BlockAssetTotals } from "@/shared/lib/blocks/assetTotals";
import type { BlockchainState, BlockRecord, FeeEstimate } from "@/shared/lib/rpc/types";

/** Per-block statistics from Coinset's dashboard `block` events. */
export interface BlockStats {
  height: number;
  headerHash: string;
  timestampMs: number | null;
  isTransactionBlock: boolean;
  txCount: number;
  coinSpendCount: number;
  totalCost: number;
  /** Mojos as a decimal string. */
  totalFee: string;
  avgFeeRate: number;
  costPercent: number;
}

export type ChainChannel = "websocket" | "polling" | "connecting";

export interface ChainSnapshot {
  network: NetworkId;
  generatedAt: number;
  channel: ChainChannel;
  state: BlockchainState;
  /** Newest first. */
  blocks: BlockRecord[];
  stats: BlockStats[];
  /** Per-asset totals of recent transaction blocks (first page of Coinset summaries), keyed by height. */
  assets: Record<string, BlockAssetTotals>;
  fee: { cost: number; estimate: FeeEstimate } | null;
}
