/**
 * Incremental mempool sync: `get_all_mempool_items` carries full puzzle reveals
 * and can be tens of MB on a busy mempool, so instead of re-fetching it on every tick, fetch the
 * id list (cheap) and only the items not already known, keeping a running map. One instance per
 * network persists for the tab's lifetime.
 *
 * A single item is a few hundred KB of puzzle reveals (measured 2026-09-19: 98 items, 17 MB),
 * so the map never holds the fetched item: `reduce` turns it into what the UI keeps (a ~1 KB
 * compact item) once, when it arrives, and the full item is left to the garbage collector.
 */
import { createLimiter } from "@/shared/lib/limit";
import type { MempoolItem } from "@/shared/lib/rpc/types";

export interface MempoolItemSyncDeps<T> {
  getAllMempoolTxIds: (signal?: AbortSignal) => Promise<string[]>;
  getMempoolItemByTxId: (id: string, signal?: AbortSignal) => Promise<MempoolItem>;
  /** Runs once per item; `firstSeen` is when this tab first observed it (epoch ms). */
  reduce: (item: MempoolItem, firstSeen: number) => T;
  /** Entries known from an earlier visit, by tx id: ids still live are not fetched again. */
  seed?: Iterable<readonly [string, T]>;
  now?: () => number;
  /** Concurrent get_mempool_item_by_tx_id calls while catching up. */
  concurrency?: number;
}

export interface MempoolItemSync<T> {
  /**
   * Diffs against the live id list, fetches only new items, and returns every known entry.
   * The entries are the same objects from one sync to the next while an item stays.
   */
  sync: (signal?: AbortSignal) => Promise<T[]>;
  readonly size: number;
}

export function createMempoolItemSync<T>(deps: MempoolItemSyncDeps<T>): MempoolItemSync<T> {
  const now = deps.now ?? Date.now;
  const limit = createLimiter(deps.concurrency ?? 8);
  const known = new Map<string, T>(deps.seed ?? []);

  return {
    async sync(signal) {
      const ids = await deps.getAllMempoolTxIds(signal);
      const live = new Set(ids);
      [...known.keys()].filter((id) => !live.has(id)).forEach((id) => known.delete(id));
      const newIds = ids.filter((id) => !known.has(id));
      await Promise.all(
        newIds.map((id) =>
          limit(async () => {
            try {
              const item = await deps.getMempoolItemByTxId(id, signal);
              known.set(id, deps.reduce(item, now()));
            } catch {
              // Left the mempool between listing and fetching, or a transient error: the next
              // sync tries again if the id is still live.
            }
          })
        )
      );
      return [...known.values()];
    },
    get size() {
      return known.size;
    },
  };
}
