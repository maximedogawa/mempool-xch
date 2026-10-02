/**
 * Per-block asset totals kept in localStorage. A block's transactions never change under its
 * header hash, so a reload must not ask Coinset for them again: every avoided
 * get_block_transactions is one fewer chance to hit the gateway's 503/429, which carry no CORS
 * headers and therefore surface in the browser as a CORS failure. Bounded, newest blocks kept.
 */
import type { BlockAssetTotals } from "./assetTotals";

export const TOTALS_CACHE_KEY_PREFIX = "mempool-xch:block-totals:v1:";
export const TOTALS_CACHE_MAX_ENTRIES = 300;

interface CachedTotals {
  height: number;
  totals: BlockAssetTotals;
}

type TotalsCache = Record<string, CachedTotals>;

function isTotals(v: unknown): v is BlockAssetTotals {
  const t = v as BlockAssetTotals | null;
  return (
    !!t &&
    typeof t === "object" &&
    typeof t.xch === "string" &&
    Array.isArray(t.cats) &&
    typeof t.nfts === "number" &&
    typeof t.dids === "number" &&
    typeof t.singletons === "number" &&
    (t.source === "coinset" || t.source === "rpc") &&
    typeof t.count === "number" &&
    typeof t.partial === "boolean"
  );
}

function readCache(storage: Pick<Storage, "getItem"> | null, network: string): TotalsCache {
  try {
    const raw = storage?.getItem(`${TOTALS_CACHE_KEY_PREFIX}${network}`);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as TotalsCache)
      : {};
  } catch {
    return {};
  }
}

export function loadCachedTotals(
  storage: Pick<Storage, "getItem"> | null,
  network: string,
  hash: string,
  source: BlockAssetTotals["source"]
): BlockAssetTotals | null {
  const entry = readCache(storage, network)[hash.toLowerCase()];
  return entry && isTotals(entry.totals) && entry.totals.source === source ? entry.totals : null;
}

export function saveCachedTotals(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null,
  network: string,
  block: { height: number; hash: string },
  totals: BlockAssetTotals
): void {
  // An empty total may just be the indexer lagging behind a fresh block: never pin it.
  if (totals.count === 0) return;
  const key = `${TOTALS_CACHE_KEY_PREFIX}${network}`;
  try {
    const cache = readCache(storage, network);
    cache[block.hash.toLowerCase()] = { height: block.height, totals };
    const entries = Object.entries(cache)
      .filter(([, e]) => e && typeof e.height === "number")
      .sort(([, a], [, b]) => b.height - a.height)
      .slice(0, TOTALS_CACHE_MAX_ENTRIES);
    storage?.setItem(key, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Quota or private mode: start over rather than keep a cache that can no longer grow.
    try {
      storage?.removeItem(key);
    } catch {
      // Storage is unusable; totals are simply fetched again.
    }
  }
}
