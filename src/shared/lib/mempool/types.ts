/**
 * Compact mempool view shared by the summary API (server) and the browser fallback. It is what
 * the dashboard, the projected blocks and the mempool table consume: no puzzle reveals, amounts
 * as decimal strings so the JSON stays exact (TASK-025).
 */
export type TxKindHint = "xch" | "cat" | "nft" | "did" | "offer" | "singleton" | "unknown";

export interface CompactCoin {
  /** Puzzle hash without 0x. */
  ph: string;
  /** Mojos as a decimal string. */
  amount: string;
  /** Parent coin info without 0x (removals only need it to compute the coin id). */
  parent: string;
}

export interface CompactMempoolItem {
  /** Spend bundle name / tx id without 0x. */
  id: string;
  /** Fee in mojos as a decimal string. */
  fee: string;
  cost: number;
  /** Fee per CLVM cost (mojos / cost). */
  feeRate: number;
  /** Number of coin spends in the bundle. */
  spends: number;
  /** First MAX_COINS_PER_ITEM additions; see additionCount for the real number. */
  additions: CompactCoin[];
  removals: CompactCoin[];
  additionCount: number;
  removalCount: number;
  /** Total XCH-like value moved (sum of removals) as decimal mojos. */
  value: string;
  /** Unix ms when this item was first observed by the source. */
  firstSeen: number;
  kind: TxKindHint;
  /** CAT asset ids or NFT/DID launcher ids detected from the puzzle reveals. */
  assetIds: string[];
}

export interface MempoolStateSummary {
  peakHeight: number;
  peakHash: string;
  lastTxBlockHeight: number;
  mempoolSize: number;
  mempoolCost: number;
  mempoolMaxTotalCost: number;
  /** Mojos as a decimal string. */
  mempoolFees: string;
  blockMaxCost: number;
  averageBlockTime: number;
  /** Minimum fee per cost required to enter the mempool right now (0 while it has capacity). */
  minFeeRate: number;
  synced: boolean;
}

export interface MempoolSummary {
  network: string;
  /** Unix ms when the summary was assembled. */
  generatedAt: number;
  source: "server" | "browser";
  state: MempoolStateSummary;
  items: CompactMempoolItem[];
}
