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

export interface NamedPoolSummary {
  entry: PoolEntry;
  poolPuzzleHashes: string[];
  blocks: number;
  share: number;
}

export interface UnidentifiedSummary {
  addressCount: number;
  blocks: number;
  share: number;
}

export interface PoolSummary {
  named: NamedPoolSummary[];
  unidentified: UnidentifiedSummary | null;
  totalBlocks: number;
}

/**
 * Collapses a PoolShare for display: rows for the same registry entry merge into one (a pool can
 * publish more than one payout hash), and every row with no registry match rolls into a single
 * "unidentified" bucket instead of one row per address (TASK feedback: the page is unreadable
 * once a window has hundreds of distinct solo-farmer addresses).
 */
export function summarizePoolShare(share: PoolShare): PoolSummary {
  const byEntry = new Map<PoolEntry, { blocks: number; hashes: string[] }>();
  let unidentifiedBlocks = 0;
  let unidentifiedAddresses = 0;
  for (const row of share.rows) {
    if (row.entry) {
      const existing = byEntry.get(row.entry);
      if (existing) {
        existing.blocks += row.blocks;
        existing.hashes.push(row.poolPuzzleHash);
      } else {
        byEntry.set(row.entry, { blocks: row.blocks, hashes: [row.poolPuzzleHash] });
      }
    } else {
      unidentifiedBlocks += row.blocks;
      unidentifiedAddresses += 1;
    }
  }
  const named = [...byEntry.entries()]
    .map(([entry, { blocks, hashes }]) => ({
      entry,
      poolPuzzleHashes: hashes,
      blocks,
      share: share.totalBlocks > 0 ? blocks / share.totalBlocks : 0,
    }))
    .sort((a, b) => b.blocks - a.blocks || a.entry.name.localeCompare(b.entry.name));
  const unidentified =
    unidentifiedAddresses > 0
      ? { addressCount: unidentifiedAddresses, blocks: unidentifiedBlocks, share: share.totalBlocks > 0 ? unidentifiedBlocks / share.totalBlocks : 0 }
      : null;
  return { named, unidentified, totalBlocks: share.totalBlocks };
}
