"use client";

import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { browserStorage } from "@/shared/lib/browserStorage";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import { isVeiled, UNCLASSIFIED, type Sensitivity } from "@/shared/lib/nft/sensitivity";
import { fetchNftMetadata } from "@/widgets/assets/nftMetadata";
import type { GogglesPrefs } from "./model";
import { loadPrefs, savePrefs } from "./prefsStore";

/** Filters and view choices, read once on mount and written back on every change. */
export function useGogglesPrefs() {
  // The widget is client-only (dynamic, ssr: false), so reading storage while rendering is safe.
  const [prefs, setPrefs] = useState<GogglesPrefs>(() => loadPrefs(browserStorage()));
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    savePrefs(browserStorage(), prefs);
  }, [prefs]);
  return [prefs, setPrefs] as const;
}

/** Width of an element, followed with a ResizeObserver (0 until measured). */
export function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.round(el.getBoundingClientRect().width));
    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w !== undefined) setWidth(Math.round(w));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

/** False while the tab is in the background: animations and the clock pause. */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState !== "hidden"
  );
  useEffect(() => {
    const update = () => setVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}

/** Wall clock for "new" and "time in mempool", ticking while the tab is visible. */
export function useNow(visible: boolean, everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [visible, everyMs]);
  return now;
}

/** NFT lookups for the largest NFT bundles only: one cached MintGarden call each. */
export const MAX_NFT_LOOKUPS = 24;

export interface NftInfo {
  /** Thumbnail for a tile, null while unknown or when the artwork is flagged. */
  image: (launcherId: string) => string | null;
  /** Collection id and name, when MintGarden knows them. */
  collection: (launcherId: string) => { id: string; name: string | null } | null;
  /** Name of the NFT itself, for search. */
  name: (launcherId: string) => string | null;
  /**
   * MintGarden's verdict; an NFT this tab has not classified is treated as sensitive, so a
   * blocked thumbnail never shows on a tile we did not look up.
   */
  verdict: (launcherId: string) => Sensitivity;
}

export function useNftInfo(items: CompactMempoolItem[] | undefined): NftInfo {
  const launchers = useMemo(
    () =>
      (items ?? [])
        .filter((i) => i.kind === "nft" && i.assetIds[0])
        .sort((a, b) => b.cost - a.cost)
        .slice(0, MAX_NFT_LOOKUPS)
        .map((i) => i.assetIds[0]!)
        .sort(),
    [items]
  );
  const results = useQueries({
    queries: launchers.map((launcher) => ({
      queryKey: ["nftMeta", launcher],
      queryFn: () => fetchNftMetadata(launcherIdToNftId(launcher)),
      staleTime: Infinity,
      retry: false,
    })),
    combine: (all) => all.map((r) => r.data ?? null),
  });
  const byLauncher = useMemo(
    () => new Map(launchers.map((l, i) => [l, results[i] ?? null])),
    [launchers, results]
  );
  const image = useCallback(
    (l: string) => {
      const meta = byLauncher.get(l);
      return meta && !isVeiled(meta.sensitivity) ? (meta.imageUrls[0] ?? null) : null;
    },
    [byLauncher]
  );
  const collection = useCallback(
    (l: string) => {
      const meta = byLauncher.get(l);
      return meta?.collectionId ? { id: meta.collectionId, name: meta.collectionName } : null;
    },
    [byLauncher]
  );
  const name = useCallback((l: string) => byLauncher.get(l)?.name ?? null, [byLauncher]);
  const verdict = useCallback(
    (l: string) => byLauncher.get(l)?.sensitivity ?? UNCLASSIFIED,
    [byLauncher]
  );
  return useMemo(() => ({ image, collection, name, verdict }), [image, collection, name, verdict]);
}
