/**
 * Incremental mempool sync (decision-012): `get_all_mempool_items` carries full puzzle reveals
 * and can be tens of MB on a busy mempool, so instead of re-fetching it on every tick, fetch the
 * id list (cheap) and only the items not already known, keeping a running map. One instance per
 * network persists for the tab's lifetime; this mirrors what the server-side syncer used to do
 * (removed in decision-012), just running in the browser instead.
 */
import { createLimiter } from "@/shared/lib/limit";
import type { MempoolItem } from "@/shared/lib/rpc/types";

export interface MempoolSyncEntry {
  item: MempoolItem;
  /** First time this tab observed the item (epoch ms); stable across refetches while it stays. */
  firstSeen: number;
}

export interface MempoolItemSyncDeps {
  getAllMempoolTxIds: (signal?: AbortSignal) => Promise<string[]>;
  getMempoolItemByTxId: (id: string, signal?: AbortSignal) => Promise<MempoolItem>;
  now?: () => number;
  /** Concurrent get_mempool_item_by_tx_id calls while catching up. */
  concurrency?: number;
}

export interface MempoolItemSync {
  /** Diffs against the live id list, fetches only new items, and returns every known item. */
  sync: (signal?: AbortSignal) => Promise<MempoolSyncEntry[]>;
  readonly size: number;
}

export function createMempoolItemSync(deps: MempoolItemSyncDeps): MempoolItemSync {
  const now = deps.now ?? Date.now;
  const limit = createLimiter(deps.concurrency ?? 8);
  const known = new Map<string, MempoolSyncEntry>();

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
              known.set(id, { item, firstSeen: now() });
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
