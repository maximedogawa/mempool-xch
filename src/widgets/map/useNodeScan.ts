"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NetworkId } from "@/shared/config/networks";
import { GEO_BATCH_SIZE, lookupGeo } from "@/shared/lib/map/geo";
import {
  applyGeo,
  emptyRegistry,
  mergeObserved,
  parseRegistry,
  pendingGeo,
  REGISTRY_KEY_PREFIX,
  type NodeRegistry,
} from "@/shared/lib/map/registry";
import { resolveSeeder, SEEDERS, type DnsRecordType } from "@/shared/lib/map/seeders";

/** One seeder question per tick; every answer is a fresh batch of up to 32 addresses. */
export const SCAN_INTERVAL_MS = 6_000;
const LOG_LIMIT = 12;

export interface ScanEvent {
  t: number;
  seeder: string;
  type: DnsRecordType;
  answered: number;
  added: number;
  error?: string;
}

export interface NodeScanState {
  registry: NodeRegistry;
  /** True while the page is scanning (visible and mounted). */
  scanning: boolean;
  /** Seeder answers received since the page was opened. */
  scans: number;
  lastScanAt: number | null;
  log: ScanEvent[];
  /** Addresses still waiting for a location. */
  pendingGeo: number;
}

function storageKey(network: NetworkId) {
  return `${REGISTRY_KEY_PREFIX}${network}`;
}

function load(network: NetworkId): NodeRegistry {
  try {
    return parseRegistry(globalThis.localStorage?.getItem(storageKey(network)));
  } catch {
    return emptyRegistry();
  }
}

function save(network: NetworkId, registry: NodeRegistry) {
  try {
    globalThis.localStorage?.setItem(storageKey(network), JSON.stringify(registry));
  } catch {
    // Quota or private mode: the scan still works for this tab.
  }
}

/**
 * Walks the network through the DNS introducers: every SCAN_INTERVAL_MS one seeder is asked
 * (round-robin, alternating IPv4 and IPv6) over DNS-over-HTTPS, new addresses join the
 * registry and one GeoJS batch places the newest unlocated ones. Pauses while the tab is
 * hidden; the registry persists in localStorage per network so the map fills up across visits.
 */
export function useNodeScan(network: NetworkId): NodeScanState {
  const [registry, setRegistry] = useState<NodeRegistry>(emptyRegistry);
  const [scanning, setScanning] = useState(false);
  const [scans, setScans] = useState(0);
  const [lastScanAt, setLastScanAt] = useState<number | null>(null);
  const [log, setLog] = useState<ScanEvent[]>([]);
  const registryRef = useRef<NodeRegistry>(registry);
  const stepRef = useRef(0);

  const commit = useCallback(
    (next: NodeRegistry) => {
      registryRef.current = next;
      setRegistry(next);
      save(network, next);
    },
    [network]
  );

  useEffect(() => {
    const initial = load(network);
    registryRef.current = initial;
    setRegistry(initial);
    setScans(0);
    setLog([]);
    stepRef.current = 0;

    const seeders = SEEDERS[network];
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | null = null;
    let busy = false;
    let stopped = false;

    const tick = async () => {
      if (busy || stopped || document.visibilityState === "hidden") return;
      busy = true;
      const step = stepRef.current;
      stepRef.current += 1;
      const seeder = seeders[step % seeders.length]!;
      const type: DnsRecordType = Math.floor(step / seeders.length) % 2 === 0 ? "A" : "AAAA";
      const now = Date.now();
      try {
        const ips = await resolveSeeder(seeder, type, undefined, controller.signal);
        const merged = mergeObserved(registryRef.current, ips, now);
        commit(merged.registry);
        setScans((n) => n + 1);
        setLastScanAt(now);
        setLog((l) =>
          [{ t: now, seeder, type, answered: ips.length, added: merged.added.length }, ...l].slice(
            0,
            LOG_LIMIT
          )
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        setLog((l) =>
          [
            {
              t: now,
              seeder,
              type,
              answered: 0,
              added: 0,
              error: error instanceof Error ? error.message : "lookup failed",
            },
            ...l,
          ].slice(0, LOG_LIMIT)
        );
      }
      try {
        const batch = pendingGeo(registryRef.current, GEO_BATCH_SIZE);
        if (batch.length > 0)
          commit(
            applyGeo(registryRef.current, await lookupGeo(batch, undefined, controller.signal))
          );
      } catch {
        // GeoJS hiccup: the addresses stay pending and are retried next tick.
      } finally {
        busy = false;
      }
    };

    const schedule = () => {
      timer = setInterval(() => void tick(), SCAN_INTERVAL_MS);
    };
    const onVisibility = () => {
      setScanning(document.visibilityState !== "hidden");
      if (document.visibilityState !== "hidden") void tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    setScanning(document.visibilityState !== "hidden");
    void tick();
    schedule();
    return () => {
      stopped = true;
      controller.abort();
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      setScanning(false);
    };
  }, [network, commit]);

  return {
    registry,
    scanning,
    scans,
    lastScanAt,
    log,
    pendingGeo: pendingGeo(registry, Number.MAX_SAFE_INTEGER).length,
  };
}
