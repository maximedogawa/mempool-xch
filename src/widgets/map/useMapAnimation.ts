"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import {
  countsOf,
  diffCountries,
  type CountryChange,
  type CountryRow,
} from "@/shared/lib/map/stats";

/** Entrance animation length plus the longest stagger (see globals.css `.map-node-enter`). */
export const ENTRANCE_MS = 700;
export const ENTRANCE_STAGGER_MS = 900;

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * True while the map should not animate: the tab is hidden or the map is scrolled out of view.
 * The page hands it to WorldMap, which pauses every CSS animation (arcs, pulses, peer rings,
 * entrances) through `data-paused`, and the pulse and entrance timers hold while it is set.
 */
export function useAnimationPause(target: RefObject<Element | null>): boolean {
  const [hidden, setHidden] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    const element = target.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry) setOffscreen(!entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [target]);
  return hidden || offscreen;
}

interface Seen {
  version: 1;
  /** Which data the counts belong to (the snapshot's observedAt); equal means nothing is new. */
  id: string;
  counts: Record<string, number>;
}

function readSeen(key: string): Seen | null {
  try {
    const parsed = JSON.parse(globalThis.localStorage?.getItem(key) ?? "null") as Seen | null;
    return parsed && parsed.version === 1 && typeof parsed.id === "string" && parsed.counts
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function writeSeen(key: string, seen: Seen) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(seen));
  } catch {
    // Private mode or quota: the next visit simply plays the intro again.
  }
}

/**
 * Countries to animate in, keyed by row key. The first data a tab gets is compared with what
 * this browser saw last time (`storageKey`, the snapshot's id): a first visit plays every
 * country in, a newer snapshot plays only the countries that are new or changed, the same
 * snapshot again plays nothing. After that every change of `rows` (a scan answer) is compared
 * with the previous rows. Changes that arrive while `paused` wait until the map is visible;
 * reduced motion skips the animation entirely.
 */
export function useEntrances(
  rows: readonly CountryRow[],
  dataId: string,
  storageKey: string | null,
  paused: boolean
): ReadonlyMap<string, CountryChange> {
  const [entering, setEntering] = useState<ReadonlyMap<string, CountryChange>>(new Map());
  const previous = useRef<Record<string, number> | null>(null);
  const primed = useRef(false);
  const pending = useRef<Map<string, CountryChange>>(new Map());
  const signature = rows.map((row) => `${row.key}:${row.nodes}`).join("|");

  useEffect(() => {
    if (rows.length === 0) return;
    let before = previous.current;
    if (!primed.current) {
      primed.current = true;
      const seen = storageKey ? readSeen(storageKey) : null;
      if (seen && seen.id === dataId) before = countsOf(rows);
      else before = seen?.counts ?? null;
    }
    const counts = countsOf(rows);
    previous.current = counts;
    if (storageKey) writeSeen(storageKey, { version: 1, id: dataId, counts });
    if (reducedMotion()) return;
    for (const [key, change] of diffCountries(before, rows)) {
      // A country still waiting from an earlier batch keeps "new" over a later "changed".
      if (pending.current.get(key) !== "new") pending.current.set(key, change);
    }
    // Rows are compared by content; the signature stands in for the array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, dataId, storageKey]);

  useEffect(() => {
    if (paused || pending.current.size === 0) return;
    const batch = new Map(pending.current);
    pending.current.clear();
    setEntering(batch);
  }, [paused, signature]);

  // Drop the classes once the batch has played, so a later change can play again.
  useEffect(() => {
    if (entering.size === 0) return;
    const timer = setTimeout(() => setEntering(new Map()), ENTRANCE_MS + ENTRANCE_STAGGER_MS);
    return () => clearTimeout(timer);
  }, [entering]);

  return entering;
}
