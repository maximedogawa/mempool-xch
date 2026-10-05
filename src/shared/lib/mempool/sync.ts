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
import type { MempoolItem } from "@/shared/lib/rpc/types";

export interface MempoolItemSyncDeps<T> {
  getAllMempoolTxIds: (signal?: AbortSignal) => Promise<string[]>;
  getMempoolItemByTxId: (id: string, signal?: AbortSignal) => Promise<MempoolItem>;
  /**
   * The whole mempool in one call, for a gateway that counts requests (nodexch): used instead
   * of one call per item when more than `bulkAbove` items are new. One large answer then costs
   * one request, where a cold tab would otherwise send one per pending transaction.
   */
  getAllMempoolItems?: (signal?: AbortSignal) => Promise<MempoolItem[]>;
  /** New items up to this many are fetched one by one even when the bulk call exists. */
  bulkAbove?: number;
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
   * While a large backlog is being fetched (a cold tab), `onProgress` receives what is known
   * so far about once a second, so the UI can fill in instead of waiting for the last item.
   */
  sync: (signal?: AbortSignal, onProgress?: (entries: T[]) => void) => Promise<T[]>;
  readonly size: number;
}

/** With a bulk call available, up to this many new items are still fetched one by one. */
export const BULK_ABOVE = 2;

/** Fewer new ids than this arrive faster than a progress update is worth. */
export const PROGRESS_MIN_NEW = 16;
export const PROGRESS_GAP_MS = 1_000;

export function createMempoolItemSync<T>(deps: MempoolItemSyncDeps<T>): MempoolItemSync<T> {
  const now = deps.now ?? Date.now;
  const concurrency = Math.max(1, Math.floor(deps.concurrency ?? 8));
  let generation = 0;
  const known = new Map<string, T>(deps.seed ?? []);

  return {
    async sync(signal, onProgress) {
      const run = ++generation;
      const check = () => {
        signal?.throwIfAborted();
        if (run !== generation) throw new DOMException("Superseded sync", "AbortError");
      };
      check();
      const ids = await deps.getAllMempoolTxIds(signal);
      check();
      const live = new Set(ids);
      for (const id of known.keys()) if (!live.has(id)) known.delete(id);
      const newIds = [...live].filter((id) => !known.has(id));
      if (deps.getAllMempoolItems && newIds.length > (deps.bulkAbove ?? BULK_ABOVE)) {
        const wanted = new Set(newIds);
        let all: MempoolItem[] | null = null;
        try {
          all = await deps.getAllMempoolItems(signal);
        } catch {
          check();
          // The item-by-item path below still works when the listing does not.
        }
        check();
        if (all) {
          for (const item of all) {
            if (wanted.has(item.name)) known.set(item.name, deps.reduce(item, now()));
          }
          // What the listing did not hold has left again, or comes with the next sync.
          return [...known.values()];
        }
      }
      const reportProgress = onProgress && newIds.length >= PROGRESS_MIN_NEW;
      let lastProgress = now();
      let cursor = 0;
      // A fixed worker pool avoids retaining a promise and queue closure for every tx.
      await Promise.all(
        Array.from({ length: Math.min(concurrency, newIds.length) }, async () => {
          while (cursor < newIds.length) {
            check();
            const id = newIds[cursor++]!;
            let item: MempoolItem;
            try {
              item = await deps.getMempoolItemByTxId(id, signal);
            } catch {
              check();
              // Items that left or failed transiently can be retried on the next sync.
              continue;
            }
            check();
            known.set(id, deps.reduce(item, now()));
            if (reportProgress && now() - lastProgress >= PROGRESS_GAP_MS) {
              lastProgress = now();
              onProgress([...known.values()]);
            }
          }
        })
      );
      check();
      return [...known.values()];
    },
    get size() {
      return known.size;
    },
  };
}
