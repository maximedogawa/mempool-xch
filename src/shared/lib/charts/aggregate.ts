/**
 * Pure aggregation of a window of block records into one chart data point (TASK-058). Windowing
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
  const txBlocks = records.filter((r) => r.isTransactionBlock && r.timestamp !== null).sort((a, b) => a.timestamp! - b.timestamp!);
  const avgFeeMojos = txBlocks.length > 0 ? txBlocks.reduce((s, r) => s + Number(r.fees ?? 0n), 0) / txBlocks.length : 0;
  let avgSecondsBetweenTxBlocks: number | null = null;
  if (txBlocks.length >= 2) {
    const gaps: number[] = [];
    for (let i = 1; i < txBlocks.length; i += 1) gaps.push(txBlocks[i]!.timestamp! - txBlocks[i - 1]!.timestamp!);
    avgSecondsBetweenTxBlocks = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  }
  return {
    t,
    avgFeeMojos,
    txBlocksPerHour: (txBlocks.length / spanSeconds) * 3600,
    blocksPerHour: (records.length / spanSeconds) * 3600,
    shareOfTxBlocks: txBlocks.length / records.length,
    avgSecondsBetweenTxBlocks,
  };
}

export interface BlockSeries {
  fees: Point[];
  txBlocksPerHour: Point[];
  blocksPerHour: Point[];
  shareOfTxBlocks: Point[];
  timeBetweenTxBlocks: Point[];
}

export function blockWindowSeries(windows: BlockRecord[][]): BlockSeries {
  const stats = windows.map(aggregateBlockWindow).filter((s): s is BlockWindowStats => s !== null);
  return {
    fees: stats.map((s) => ({ t: s.t, v: s.avgFeeMojos })),
    txBlocksPerHour: stats.map((s) => ({ t: s.t, v: s.txBlocksPerHour })),
    blocksPerHour: stats.map((s) => ({ t: s.t, v: s.blocksPerHour })),
    shareOfTxBlocks: stats.map((s) => ({ t: s.t, v: s.shareOfTxBlocks })),
    timeBetweenTxBlocks: stats.filter((s) => s.avgSecondsBetweenTxBlocks !== null).map((s) => ({ t: s.t, v: s.avgSecondsBetweenTxBlocks! })),
  };
}
