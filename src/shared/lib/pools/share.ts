import type { BlockRecord } from "@/shared/lib/rpc/types";
import { lookupPool, type PoolEntry } from "./registry";

export interface PoolShareRow {
  poolPuzzleHash: string;
  entry: PoolEntry | null;
  blocks: number;
  share: number;
}

export interface PoolShare {
  rows: PoolShareRow[];
  totalBlocks: number;
  identifiedBlocks: number;
  identifiedShare: number;
}

/** Groups blocks by pool payout puzzle hash, most blocks first (TASK-060). */
export function groupPoolShare(records: readonly BlockRecord[]): PoolShare {
  const counts = new Map<string, number>();
  for (const r of records) {
    counts.set(r.poolPuzzleHash, (counts.get(r.poolPuzzleHash) ?? 0) + 1);
  }
  const totalBlocks = records.length;
  const rows: PoolShareRow[] = [...counts.entries()]
    .map(([poolPuzzleHash, blocks]) => ({
      poolPuzzleHash,
      entry: lookupPool(poolPuzzleHash),
      blocks,
      share: totalBlocks > 0 ? blocks / totalBlocks : 0,
    }))
    .sort((a, b) => b.blocks - a.blocks || a.poolPuzzleHash.localeCompare(b.poolPuzzleHash));
  const identifiedBlocks = rows.filter((r) => r.entry !== null).reduce((sum, r) => sum + r.blocks, 0);
  return { rows, totalBlocks, identifiedBlocks, identifiedShare: totalBlocks > 0 ? identifiedBlocks / totalBlocks : 0 };
}
