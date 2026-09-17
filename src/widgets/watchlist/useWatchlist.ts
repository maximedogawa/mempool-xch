"use client";

import { useSyncExternalStore } from "react";
import { getWatchlistStore, type WatchItem } from "@/shared/lib/watchlist/store";

const EMPTY: WatchItem[] = [];

/** Subscribes to the local watchlist store (TASK-071). */
export function useWatchlist() {
  const store = getWatchlistStore();
  const items = useSyncExternalStore(store.subscribe, store.get, () => EMPTY);
  return { items, add: store.add, remove: store.remove, has: store.has };
}
