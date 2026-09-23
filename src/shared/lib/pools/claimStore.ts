import type { NetworkId } from "@/shared/config/networks";
import type { PoolClaim } from "./claims";

/**
 * Browser-local cache of resolved pool claims: payout puzzle hash to claim target.
 * A farmer's PlotNFT rarely changes pool, so the pools page only has to look up addresses it has
 * not seen before; nothing is stored on a server. Same external-store shape as
 * src/shared/lib/watchlist/store.ts so React reads it with useSyncExternalStore.
 */
export interface StoredClaim extends PoolClaim {
  /** When the claim was resolved, ms since epoch. */
  at: number;
}

export type ClaimMap = ReadonlyMap<string, StoredClaim>;

export const STORAGE_KEY_PREFIX = "mempool-xch:pool-claims:v1:";
/** A farmer can switch pools; a resolved claim is re-checked after two weeks. */
const RESOLVED_TTL_MS = 14 * 24 * 60 * 60 * 1000;
/** "No claim yet" is usually a reward the pool has not collected; look again soon. */
const UNRESOLVED_TTL_MS = 12 * 60 * 60 * 1000;
export const MAX_ENTRIES = 4000;

export function isFresh(claim: StoredClaim, now: number): boolean {
  return now - claim.at < (claim.target ? RESOLVED_TTL_MS : UNRESOLVED_TTL_MS);
}

/** Compact on-disk row: [target, selfPooled, at]. */
type Row = [string | null, 0 | 1, number];

function parse(raw: string | null | undefined): Map<string, StoredClaim> {
  const out = new Map<string, StoredClaim>();
  if (!raw) return out;
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object") return out;
  for (const [hash, row] of Object.entries(data as Record<string, unknown>)) {
    if (!/^[0-9a-f]{64}$/.test(hash) || !Array.isArray(row)) continue;
    const [target, selfPooled, at] = row as unknown[];
    if (
      (target !== null && (typeof target !== "string" || !/^[0-9a-f]{64}$/.test(target))) ||
      typeof at !== "number"
    )
      continue;
    out.set(hash, { target, selfPooled: selfPooled === 1, at });
  }
  return out;
}

type Listener = () => void;

export interface PoolClaimStore {
  get: (network: NetworkId) => ClaimMap;
  setMany: (network: NetworkId, claims: Iterable<[string, PoolClaim]>, now?: number) => void;
  subscribe: (listener: Listener) => () => void;
}

export function createPoolClaimStore(
  storage: Pick<Storage, "getItem" | "setItem"> | null
): PoolClaimStore {
  const byNetwork = new Map<NetworkId, Map<string, StoredClaim>>();
  const listeners = new Set<Listener>();

  const load = (network: NetworkId) => {
    let current = byNetwork.get(network);
    if (!current) {
      try {
        current = parse(storage?.getItem(STORAGE_KEY_PREFIX + network));
      } catch {
        current = new Map();
      }
      byNetwork.set(network, current);
    }
    return current;
  };

  return {
    get: load,
    setMany: (network, claims, now = Date.now()) => {
      // A fresh Map per write so useSyncExternalStore sees a new snapshot.
      let next = new Map(load(network));
      for (const [hash, claim] of claims) next.set(hash, { ...claim, at: now });
      if (next.size > MAX_ENTRIES) {
        next = new Map([...next].sort((a, b) => b[1].at - a[1].at).slice(0, MAX_ENTRIES));
      }
      byNetwork.set(network, next);
      try {
        const rows: Record<string, Row> = {};
        for (const [hash, c] of next) rows[hash] = [c.target, c.selfPooled ? 1 : 0, c.at];
        storage?.setItem(STORAGE_KEY_PREFIX + network, JSON.stringify(rows));
      } catch {
        // Storage may be unavailable or full; keep the claims in memory for this session.
      }
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

let browserStore: PoolClaimStore | null = null;

/** Singleton store bound to window.localStorage (in-memory during SSR). */
export function getPoolClaimStore(): PoolClaimStore {
  if (!browserStore) {
    const storage = typeof window !== "undefined" ? window.localStorage : null;
    browserStore = createPoolClaimStore(storage);
  }
  return browserStore;
}
