/**
 * Pure aggregation of a window of block records into one chart data point. Windowing
 * (which heights go in which window) and fetching live in the chart hooks; this file only turns
 * a records array into numbers, so it can be unit-tested against fixture-shaped records.
 */
import type { BlockRecord } from "@/shared/lib/rpc/types";
import type { Point } from "./smoothing";

export interface BlockWindowStats {
  /** Window midpoint, in ms (the midpoint of its transaction-block timestamps). */
  t: number;
  avgFeeMojos: number;
  txBlocksPerHour: number;
  blocksPerHour: number;
  /** Transaction blocks / all blocks in the window. */
  shareOfTxBlocks: number;
  /** Average seconds between consecutive transaction blocks; null with fewer than two. */
  avgSecondsBetweenTxBlocks: number | null;
  /**
   * Median difficulty in the window; null without two consecutive heights. A block's weight is
   * the cumulative difficulty of the chain up to it, so the weight step from one height to the
   * next is that block's difficulty.
   */
  difficulty: number | null;
}

/** Median weight step between consecutive heights (see BlockWindowStats.difficulty). */
export function windowDifficulty(records: BlockRecord[]): number | null {
  const sorted = [...records].sort((a, b) => a.height - b.height);
  const steps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur.height === prev.height + 1 && cur.weight > prev.weight)
      steps.push(Number(cur.weight - prev.weight));
  }
  if (steps.length === 0) return null;
  steps.sort((a, b) => a - b);
  const mid = Math.floor(steps.length / 2);
  return steps.length % 2 === 1 ? steps[mid]! : (steps[mid - 1]! + steps[mid]!) / 2;
}

/** One window's stats, or null when it carries no timestamped (transaction) block to anchor on. */
export function aggregateBlockWindow(records: BlockRecord[]): BlockWindowStats | null {
  if (records.length === 0) return null;
  const times = records.map((r) => r.timestamp).filter((t): t is number => t !== null);
  if (times.length === 0) return null;
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const t = ((minT + maxT) / 2) * 1000;
  const spanSeconds = Math.max(1, maxT - minT);
  const txBlocks = records
    .filter((r) => r.isTransactionBlock && r.timestamp !== null)
    .sort((a, b) => a.timestamp! - b.timestamp!);
  const avgFeeMojos =
    txBlocks.length > 0
      ? txBlocks.reduce((s, r) => s + Number(r.fees ?? 0n), 0) / txBlocks.length
      : 0;
  let avgSecondsBetweenTxBlocks: number | null = null;
  if (txBlocks.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < txBlocks.length; i += 1)
      gaps.push(txBlocks[i]!.timestamp! - txBlocks[i - 1]!.timestamp!);
    avgSecondsBetweenTxBlocks = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }
  return {
    t,
    avgFeeMojos,
    txBlocksPerHour: (txBlocks.length / spanSeconds) * 3600,
    blocksPerHour: (records.length / spanSeconds) * 3600,
    shareOfTxBlocks: txBlocks.length / records.length,
    avgSecondsBetweenTxBlocks,
    difficulty: windowDifficulty(records),
  };
}

export interface BlockSeries {
  fees: Point[];
  txBlocksPerHour: Point[];
  blocksPerHour: Point[];
  shareOfTxBlocks: Point[];
  timeBetweenTxBlocks: Point[];
  difficulty: Point[];
}

export function blockWindowSeries(windows: BlockRecord[][]): BlockSeries {
  const stats = windows.map(aggregateBlockWindow).filter((s): s is BlockWindowStats => s !== null);
  return {
    fees: stats.map((s) => ({ t: s.t, v: s.avgFeeMojos })),
    txBlocksPerHour: stats.map((s) => ({ t: s.t, v: s.txBlocksPerHour })),
    blocksPerHour: stats.map((s) => ({ t: s.t, v: s.blocksPerHour })),
    shareOfTxBlocks: stats.map((s) => ({ t: s.t, v: s.shareOfTxBlocks })),
    timeBetweenTxBlocks: stats
      .filter((s) => s.avgSecondsBetweenTxBlocks !== null)
      .map((s) => ({ t: s.t, v: s.avgSecondsBetweenTxBlocks! })),
    difficulty: stats
      .filter((s) => s.difficulty !== null)
      .map((s) => ({ t: s.t, v: s.difficulty! })),
  };
}

/**
 * The newest transaction block of each window: the bounded sample the cost and spends series
 * fetch in full (one get_block and one get_additions_and_removals each), so a range costs as
 * many block fetches as it has windows, not as many as it has blocks.
 */
export function newestTxBlockPerWindow(windows: BlockRecord[][]): BlockRecord[] {
  return windows.flatMap((records) => {
    const tx = records.filter((r) => r.isTransactionBlock && r.timestamp !== null);
    if (tx.length === 0) return [];
    return [tx.reduce((a, b) => (b.height > a.height ? b : a))];
  });
}
