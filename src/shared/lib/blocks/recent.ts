import type { BlockRecord } from "@/shared/lib/rpc/types";

export interface RecentBlocksResult {
  /** Newest first. */
  txBlocks: BlockRecord[];
  /** Every record in the window, newest first, for gap markers. */
  all: BlockRecord[];
}

/** The window of the last `count` transaction blocks and the blocks between them. */
export function recentWindow(records: BlockRecord[], count: number): RecentBlocksResult {
  const all = [...records].sort((a, b) => b.height - a.height);
  const txBlocks = all.filter((r) => r.isTransactionBlock).slice(0, count);
  const oldest = txBlocks[txBlocks.length - 1]?.height ?? 0;
  return { txBlocks, all: all.filter((r) => r.height >= oldest) };
}

/**
 * The window after a block a gateway's socket pushed (a nodexch `block` frame, TASK-148): the
 * record replaces one of the same height (a reorg) and the window slides on. The same result
 * comes back when the block adds nothing new.
 */
export function addRecentBlock(
  prev: RecentBlocksResult,
  record: BlockRecord,
  count: number
): RecentBlocksResult {
  const same = prev.all.find((r) => r.height === record.height);
  if (same && same.headerHash === record.headerHash) return prev;
  return recentWindow([record, ...prev.all.filter((r) => r.height !== record.height)], count);
}
