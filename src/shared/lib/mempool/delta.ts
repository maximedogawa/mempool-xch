import type { CompactMempoolItem, MempoolSummary } from "./types";

/**
 * A summary after what a gateway's `mempool_delta` frame says entered and left the mempool.
 * Items keep their identity and their order, new ones go to the end; the same summary comes
 * back when the frame changes nothing (a delta seen twice, or already in a fresh read).
 */
export function applyMempoolDelta(
  summary: MempoolSummary,
  added: CompactMempoolItem[],
  removed: string[],
  now = Date.now()
): MempoolSummary {
  const gone = new Set(removed);
  const known = new Set(summary.items.map((item) => item.id));
  const fresh = added.filter((item) => !known.has(item.id) && !gone.has(item.id));
  const kept = summary.items.filter((item) => !gone.has(item.id));
  if (fresh.length === 0 && kept.length === summary.items.length) return summary;
  return { ...summary, generatedAt: now, items: [...kept, ...fresh] };
}
