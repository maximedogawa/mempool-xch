/**
 * Watchlist of addresses, transaction ids and DIDs. Local only, never sent anywhere: a tiny
 * external store so React reads it with useSyncExternalStore. Follows the same shape as
 * src/shared/lib/settings/store.ts (cached snapshot, not a fresh array per get(), so
 * useSyncExternalStore does not loop).
 */

import { browserStorage } from "@/shared/lib/browserStorage";

export type WatchKind = "address" | "tx" | "did";

const KINDS: readonly WatchKind[] = ["address", "tx", "did"];

export interface WatchItem {
  kind: WatchKind;
  /** Puzzle hash (address), transaction id or DID launcher id: lowercase hex, no 0x prefix. */
  id: string;
  /** What to show: the bech32 address, the did:chia: id, or the tx id itself. */
  label: string;
  addedAt: number;
}

export const STORAGE_KEY = "mempool-xch:watchlist:v1";
const MAX_ITEMS = 50;

function normaliseId(id: string): string {
  return id.trim().toLowerCase().replace(/^0x/, "");
}

function sanitise(raw: unknown): WatchItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: WatchItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Partial<WatchItem>;
    if (
      !KINDS.includes(e.kind as WatchKind) ||
      typeof e.id !== "string" ||
      typeof e.label !== "string"
    )
      continue;
    const id = normaliseId(e.id);
    const key = `${e.kind}:${id}`;
    if (!id || seen.has(key)) continue;
    seen.add(key);
    items.push({
      kind: e.kind as WatchKind,
      id,
      label: e.label,
      addedAt: typeof e.addedAt === "number" ? e.addedAt : Date.now(),
    });
    if (items.length >= MAX_ITEMS) break;
  }
  return items;
}

type Listener = () => void;

export interface WatchlistStore {
  get: () => WatchItem[];
  add: (item: Omit<WatchItem, "addedAt">) => void;
  remove: (kind: WatchKind, id: string) => void;
  has: (kind: WatchKind, id: string) => boolean;
  subscribe: (listener: Listener) => () => void;
}

export function createWatchlistStore(
  storage: Pick<Storage, "getItem" | "setItem"> | null
): WatchlistStore {
  let current: WatchItem[] = [];
  const listeners = new Set<Listener>();
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) current = sanitise(JSON.parse(raw));
  } catch {
    current = [];
  }
  const persist = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage may be unavailable (private mode); keep in memory for this session.
    }
  };
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => current,
    add: (item) => {
      const id = normaliseId(item.id);
      if (!id || current.some((i) => i.kind === item.kind && i.id === id)) return;
      current = [...current, { kind: item.kind, id, label: item.label, addedAt: Date.now() }].slice(
        -MAX_ITEMS
      );
      persist();
      emit();
    },
    remove: (kind, id) => {
      const norm = normaliseId(id);
      const next = current.filter((i) => !(i.kind === kind && i.id === norm));
      if (next.length === current.length) return;
      current = next;
      persist();
      emit();
    },
    has: (kind, id) => current.some((i) => i.kind === kind && i.id === normaliseId(id)),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

let browserStore: WatchlistStore | null = null;

/** Singleton store bound to window.localStorage (in-memory during SSR). */
export function getWatchlistStore(): WatchlistStore {
  if (!browserStore) {
    browserStore = createWatchlistStore(browserStorage());
  }
  return browserStore;
}
