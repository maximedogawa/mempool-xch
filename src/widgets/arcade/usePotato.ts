"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import arcade from "@/shared/config/arcade.json";
import {
  advanceTip,
  newerTip,
  potatoChild,
  potatoState,
  type PotatoTip,
} from "@/shared/lib/potato/potato";
import { useSettings } from "@/shared/providers/SettingsProvider";

const TIP_KEY = "mempool-xch:potato-tip:v1";
export const POTATO_REFRESH_MS = 45_000;
/** Snatches walked per refresh at most; a busy day is a handful, so this only guards a stale snapshot. */
const MAX_HOPS_PER_REFRESH = 60;

function storedTip(): PotatoTip | null {
  try {
    const raw = globalThis.localStorage?.getItem(TIP_KEY);
    const parsed = raw ? (JSON.parse(raw) as PotatoTip) : null;
    return parsed && typeof parsed.coinId === "string" && typeof parsed.hops === "number"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function storeTip(tip: PotatoTip) {
  try {
    globalThis.localStorage?.setItem(TIP_KEY, JSON.stringify(tip));
  } catch {
    // Storage unavailable: the walk simply restarts from the snapshot next time.
  }
}

/**
 * Follows the Pot Potato round from the committed snapshot tip: each refresh asks Coinset for
 * the tip's children and advances while a snatch child exists, then persists the new tip.
 * The countdown ticks locally between refreshes.
 */
export function usePotato() {
  const { client, endpoints, hydrated } = useSettings();
  const snapshot = arcade.potato as PotatoTip;
  const query = useQuery({
    queryKey: ["arcade", "potato", endpoints.network],
    enabled: hydrated && endpoints.network === "mainnet",
    refetchInterval: POTATO_REFRESH_MS,
    staleTime: POTATO_REFRESH_MS,
    retry: 1,
    queryFn: async ({ signal }): Promise<PotatoTip> => {
      let tip = newerTip(snapshot, storedTip()) ?? snapshot;
      if (tip.ended) return tip;
      for (let i = 0; i < MAX_HOPS_PER_REFRESH; i += 1) {
        const children = await client.getCoinRecordsByParentIds([tip.coinId], true, signal);
        if (children.length === 0) break;
        const child = potatoChild(BigInt(tip.amount), children);
        if (!child) {
          tip = { ...tip, ended: true };
          break;
        }
        tip = advanceTip(tip, child);
        if (!child.spent) break;
      }
      if (tip.hops !== snapshot.hops || tip.ended) storeTip(tip);
      return tip;
    },
  });
  const tip = query.data ?? newerTip(snapshot, null) ?? snapshot;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  return {
    tip,
    state: potatoState(tip, now),
    live: !!query.data,
    isFetching: query.isFetching,
    error: query.error,
    snapshotAt: arcade.snapshotAt,
  };
}
