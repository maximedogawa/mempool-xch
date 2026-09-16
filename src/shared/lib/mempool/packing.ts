/**
 * Projected next blocks (TASK-006): pack mempool items by descending fee per cost into blocks
 * bounded by block_max_cost, the same greedy order the Chia node uses when it fills a
 * transaction block. Pure and deterministic so it can be unit tested with fixtures.
 */
import type { CompactMempoolItem } from "./types";

export interface ProjectedBlock {
  index: number;
  items: CompactMempoolItem[];
  totalCost: number;
  /** 0..1 share of block_max_cost. */
  fill: number;
  /** Total fees in mojos. */
  totalFee: bigint;
  minFeeRate: number;
  maxFeeRate: number;
  medianFeeRate: number;
  /** Seconds until this block is expected to be farmed. */
  etaSeconds: number;
}

export interface PackingOptions {
  blockMaxCost: number;
  /** Average seconds between any two blocks (transaction or not). */
  averageBlockTime: number;
  /** Fraction of blocks that carry transactions. */
  txBlockRatio?: number;
  /** Upper bound on the number of projected blocks returned (the rest are folded into the last). */
  maxBlocks?: number;
}

export function sortByFeeRate(items: CompactMempoolItem[]): CompactMempoolItem[] {
  return [...items].sort((a, b) => {
    if (b.feeRate !== a.feeRate) return b.feeRate - a.feeRate;
    if (a.firstSeen !== b.firstSeen) return a.firstSeen - b.firstSeen;
    return a.id < b.id ? -1 : 1;
  });
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
}

function summarise(
  index: number,
  items: CompactMempoolItem[],
  options: PackingOptions
): ProjectedBlock {
  const rates = items.map((i) => i.feeRate);
  const totalCost = items.reduce((s, i) => s + i.cost, 0);
  const txBlockInterval = options.averageBlockTime / (options.txBlockRatio ?? 0.36);
  return {
    index,
    items,
    totalCost,
    fill: Math.min(1, totalCost / options.blockMaxCost),
    totalFee: items.reduce((s, i) => s + BigInt(i.fee), 0n),
    minFeeRate: rates.length ? Math.min(...rates) : 0,
    maxFeeRate: rates.length ? Math.max(...rates) : 0,
    medianFeeRate: median(rates),
    etaSeconds: Math.round(txBlockInterval * (index + 1)),
  };
}

/**
 * Packs the way chia's Mempool.create_block_generator does: walk items in fee-per-cost order
 * (ties by arrival), take every item that still fits the block and skip the ones that do not;
 * skipped items are the first candidates for the following block. Items larger than a block
 * are impossible on chain and are dropped. (The node additionally compresses the generator, so
 * a real block's cost is at or below the sum of its items' costs.)
 */
export function packProjectedBlocks(
  items: CompactMempoolItem[],
  options: PackingOptions
): ProjectedBlock[] {
  let remaining = sortByFeeRate(items).filter((i) => i.cost <= options.blockMaxCost);
  const buckets: CompactMempoolItem[][] = [];
  while (remaining.length > 0) {
    const block: CompactMempoolItem[] = [];
    const skipped: CompactMempoolItem[] = [];
    let used = 0;
    remaining.forEach((item) => {
      if (used + item.cost <= options.blockMaxCost) {
        block.push(item);
        used += item.cost;
      } else {
        skipped.push(item);
      }
    });
    buckets.push(block);
    remaining = skipped;
  }
  const maxBlocks = options.maxBlocks ?? 8;
  const visible = buckets.slice(0, maxBlocks);
  const overflow = buckets.slice(maxBlocks).flat();
  if (overflow.length > 0 && visible.length > 0) {
    visible[visible.length - 1] = [...visible[visible.length - 1]!, ...overflow];
  }
  return visible.map((bucket, index) => summarise(index, bucket, options));
}

/** Which projected block a tx id would land in, or null when it is not in the mempool. */
export function findProjectedPosition(blocks: ProjectedBlock[], txId: string): { block: ProjectedBlock; position: number } | null {
  const id = txId.toLowerCase().replace(/^0x/, "");
  const found = blocks
    .map((block) => ({ block, position: block.items.findIndex((i) => i.id === id) }))
    .find((entry) => entry.position !== -1);
  return found ?? null;
}
