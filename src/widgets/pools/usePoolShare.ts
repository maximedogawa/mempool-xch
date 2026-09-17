"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useBlockchainState } from "@/shared/api/hooks";
import { queryKeys } from "@/shared/api/queryKeys";
import { createLimiter } from "@/shared/lib/limit";
import { resolveClaims, type PoolClaim } from "@/shared/lib/pools/claims";
import { getPoolClaimStore, isFresh } from "@/shared/lib/pools/claimStore";
import { groupPoolShare, payoutsToResolve, type PoolShare } from "@/shared/lib/pools/share";
import { usePoolClaims } from "@/shared/lib/pools/usePoolLookup";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** Parity with xchmempool.com/pools: roughly one day of blocks. */
export const POOL_SHARE_WINDOW = 4608;
/** Coinset's get_block_records caps a single call at 1000 records. */
const CHUNK = 1000;
/** Re-bucket the peak so the window (and its query key) only moves every ~50 blocks. */
const BUCKET = 50;
/** Resolved claims reach the store (and re-group the page) in batches, not one render per lookup. */
const FLUSH_MS = 400;
/** Claim lookups in flight; Coinset answers larger bursts with errors (see limit.ts). */
const CLAIM_CONCURRENCY = 3;

const limiter = createLimiter(3);

interface PoolWindow {
  records: BlockRecord[];
  windowStart: number;
  windowEnd: number;
}

export interface PoolShareResult {
  share: PoolShare | null;
  windowStart: number | null;
  windowEnd: number | null;
  /** False on a custom node: claims come from Coinset's indexed API, so PlotNFT farmers stay ungrouped. */
  canResolveClaims: boolean;
  /** Payout addresses whose claim is still being looked up. */
  resolving: number;
  error: Error | null;
}

export function usePoolShare(): PoolShareResult {
  const { client, endpoints } = useSettings();
  const state = useBlockchainState();
  const { peakHeight } = useLive();
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  const bucketedPeak = peak !== null ? peak - (peak % BUCKET) : null;

  const query = useQuery({
    queryKey: [...queryKeys.blockRoot(endpoints.network), "poolShare", bucketedPeak],
    enabled: bucketedPeak !== null,
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<PoolWindow> => {
      const end = bucketedPeak! + 1;
      const start = Math.max(0, end - POOL_SHARE_WINDOW);
      const chunks: { start: number; end: number }[] = [];
      for (let s = start; s < end; s += CHUNK) chunks.push({ start: s, end: Math.min(end, s + CHUNK) });
      const pages = await Promise.all(chunks.map((c) => limiter(() => client.getBlockRecords(c.start, c.end, signal))));
      return { records: pages.flat(), windowStart: start, windowEnd: end - 1 };
    },
  });

  const records = query.data?.records;
  const claims = usePoolClaims();
  const payouts = useMemo(() => (records ? payoutsToResolve(records) : []), [records]);
  const [failed, setFailed] = useState<{ payouts: readonly string[]; count: number }>({ payouts, count: 0 });

  useEffect(() => {
    if (!client.hasIndexed || payouts.length === 0) return;
    const store = getPoolClaimStore();
    const known = store.get(endpoints.network);
    const now = Date.now();
    const todo = payouts.filter((p) => {
      const claim = known.get(p);
      return !claim || !isFresh(claim, now);
    });
    if (todo.length === 0) return;

    const controller = new AbortController();
    const buffer = new Map<string, PoolClaim>();
    let failures = 0;
    let reportedFailures = 0;
    const flush = () => {
      if (buffer.size > 0) {
        store.setMany(endpoints.network, [...buffer]);
        buffer.clear();
      }
      if (failures !== reportedFailures) {
        reportedFailures = failures;
        setFailed({ payouts, count: failures });
      }
    };
    const timer = setInterval(flush, FLUSH_MS);
    void resolveClaims({
      payouts: todo,
      fetchLatestTransaction: async (payout, signal) => (await client.getTransactionsByP2(payout, { limit: 1 }, signal)).transactions[0] ?? null,
      onResolved: (resolved) => resolved.forEach((claim, hash) => buffer.set(hash, claim)),
      onFailed: () => {
        failures += 1;
      },
      signal: controller.signal,
      concurrency: CLAIM_CONCURRENCY,
    }).finally(() => {
      clearInterval(timer);
      if (!controller.signal.aborted) flush();
    });
    return () => {
      controller.abort();
      clearInterval(timer);
      // Keep what was already fetched; the next run only looks up the rest.
      if (buffer.size > 0) store.setMany(endpoints.network, [...buffer]);
    };
  }, [client, endpoints.network, payouts]);

  const share = useMemo(() => (records ? groupPoolShare(records, claims) : null), [records, claims]);
  const unresolved = client.hasIndexed ? payouts.filter((p) => !claims.has(p)).length : 0;
  const failedCount = failed.payouts === payouts ? failed.count : 0;

  return {
    share,
    windowStart: query.data?.windowStart ?? null,
    windowEnd: query.data?.windowEnd ?? null,
    canResolveClaims: client.hasIndexed,
    resolving: Math.max(0, unresolved - failedCount),
    error: (query.error as Error | null) ?? null,
  };
}
