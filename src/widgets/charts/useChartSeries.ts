"use client";

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useBlockchainState } from "@/shared/api/hooks";
import { queryKeys } from "@/shared/api/queryKeys";
import { blockWindowSeries, newestTxBlockPerWindow } from "@/shared/lib/charts/aggregate";
import {
  bucketHeight,
  heightWindows,
  oldestHeightForRange,
  rangeById,
  type RangeId,
} from "@/shared/lib/charts/range";
import type { Point } from "@/shared/lib/charts/smoothing";
import { createLimiter } from "@/shared/lib/limit";
import { fetchPriceHistory } from "@/shared/lib/market/priceHistory";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { useMempoolHistory } from "@/widgets/mempool/useMempoolHistory";

const windowsLimit = createLimiter(4);
const blockSampleLimit = createLimiter(2);

/**
 * One block-record window per sample point across the range (bounded call count regardless of
 * span: there is no server-side history to lean on instead). Shared by the Blocks and
 * Network sections so they do not each fetch the same records separately.
 */
export function useChartBlockWindows(range: RangeId) {
  const { client, endpoints, hydrated } = useSettings();
  const state = useBlockchainState();
  // Bucketed so the query key (and thus the fetch) stays put between new blocks; see bucketHeight.
  const peak = state.data ? bucketHeight(state.data.peak.height) : null;
  const averageBlockTime = state.data?.averageBlockTime ?? 18.75;
  const rangeDef = rangeById(range);
  return useQuery({
    queryKey: [...queryKeys.chainRoot(endpoints.network), "chartWindows", range, peak],
    enabled: hydrated && peak !== null,
    staleTime: 60_000,
    queryFn: async ({ signal }): Promise<BlockRecord[][]> => {
      const oldest = oldestHeightForRange(peak!, rangeDef, averageBlockTime);
      const windows = heightWindows(peak!, oldest, rangeDef.windows);
      return Promise.all(
        windows.map((w) => windowsLimit(() => client.getBlockRecords(w.start, w.end, signal)))
      );
    },
  });
}

export function useBlocksChartSeries(range: RangeId) {
  const windows = useChartBlockWindows(range);
  const series = useMemo(
    () => (windows.data ? blockWindowSeries(windows.data) : null),
    [windows.data]
  );
  return { series, isLoading: windows.isLoading, error: windows.error };
}

export interface TxBlockSampleSeries {
  /** CLVM cost of each sampled transaction block (transactions_info.cost). */
  cost: Point[];
  /** Coins spent in each sampled transaction block (removals of get_additions_and_removals). */
  spends: Point[];
  isLoading: boolean;
  /** How many sampled blocks failed to load (the series then shows the rest). */
  failed: number;
}

/**
 * Cost and spends of the newest transaction block in every sampling window. A block never
 * changes under its header hash, so each one is fetched once per session and shared between
 * ranges that sample it.
 */
export function useTxBlockSampleSeries(range: RangeId): TxBlockSampleSeries {
  const { client, endpoints, hydrated } = useSettings();
  const windows = useChartBlockWindows(range);
  const sampled = useMemo(
    () => (windows.data ? newestTxBlockPerWindow(windows.data) : []),
    [windows.data]
  );
  const results = useQueries({
    queries: sampled.map((record) => ({
      queryKey: [...queryKeys.chainRoot(endpoints.network), "txBlockSample", record.headerHash],
      enabled: hydrated,
      staleTime: Infinity,
      gcTime: 30 * 60_000,
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        blockSampleLimit(async () => {
          const [block, flow] = await Promise.all([
            client.getBlock(record.headerHash, signal),
            client.getAdditionsAndRemovals(record.headerHash, signal),
          ]);
          return { cost: block.cost, spends: flow.removals.length };
        }),
    })),
  });
  return useMemo(() => {
    const cost: Point[] = [];
    const spends: Point[] = [];
    results.forEach((result, i) => {
      const record = sampled[i];
      if (!result.data || !record?.timestamp) return;
      const t = record.timestamp * 1000;
      cost.push({ t, v: result.data.cost });
      spends.push({ t, v: result.data.spends });
    });
    const byTime = (a: Point, b: Point) => a.t - b.t;
    return {
      cost: cost.sort(byTime),
      spends: spends.sort(byTime),
      isLoading: windows.isLoading || results.some((r) => r.isLoading),
      failed: results.filter((r) => r.isError).length,
    };
  }, [results, sampled, windows.isLoading]);
}

export function useNetworkChartSeries(range: RangeId) {
  const { client, endpoints, hydrated } = useSettings();
  const windows = useChartBlockWindows(range);
  const windowSeries = useMemo(
    () => (windows.data ? blockWindowSeries(windows.data) : null),
    [windows.data]
  );
  const netspace = useQuery({
    queryKey: [
      ...queryKeys.chainRoot(endpoints.network),
      "chartNetspace",
      range,
      windows.dataUpdatedAt,
    ],
    enabled: hydrated && !!windows.data && windows.data.length > 0,
    staleTime: 60_000,
    queryFn: async ({ signal }): Promise<Point[]> => {
      const usable = windows.data!.filter((w) => w.length >= 2);
      const limit = createLimiter(4);
      const results = await Promise.all(
        usable.map((w) =>
          limit(async (): Promise<Point | null> => {
            const first = w[0]!;
            const last = w[w.length - 1]!;
            // Most blocks are not transaction blocks and carry no timestamp (record.timestamp is
            // null), so the array's first/last element frequently has none — use any timestamped
            // block in the window instead, the same way aggregateBlockWindow finds its midpoint.
            const times = w.map((r) => r.timestamp).filter((t): t is number => t !== null);
            if (times.length === 0) return null;
            try {
              const space = await client.getNetworkSpace(first.headerHash, last.headerHash, signal);
              const t = ((Math.min(...times) + Math.max(...times)) / 2) * 1000;
              return { t, v: Number(space) };
            } catch {
              return null;
            }
          })
        )
      );
      return results.filter((r): r is Point => r !== null).sort((a, b) => a.t - b.t);
    },
  });
  return {
    netspace: netspace.data ?? [],
    blocksPerHour: windowSeries?.blocksPerHour ?? [],
    difficulty: windowSeries?.difficulty ?? [],
    isLoading: windows.isLoading || netspace.isLoading,
    error: windows.error ?? netspace.error,
  };
}

export interface MempoolChartSeries {
  /** Total pending cost across the mempool, mojo-cost units. */
  costUsed: Point[];
  waitingBundles: Point[];
  totalFees: Point[];
  /** Only samples taken since the median was added carry it. */
  medianFeeRate: Point[];
  /** Sampled window only (2h); other ranges have no history to show. */
  available: boolean;
  windowStartedAt: number | null;
}

/** The existing 2h browser-sampled mempool history, reshaped into chart series. */
export function useMempoolChartSeries(range: RangeId): MempoolChartSeries {
  const { history, startedAt } = useMempoolHistory();
  return useMemo(() => {
    const available = range === "6h" || range === "24h"; // sampling window is 2h; both show what there is
    if (!available || history.length < 2)
      return {
        costUsed: [],
        waitingBundles: [],
        totalFees: [],
        medianFeeRate: [],
        available: false,
        windowStartedAt: startedAt,
      };
    return {
      costUsed: history.map((s) => ({ t: s.t, v: s.bands.reduce((a, b) => a + b, 0) })),
      waitingBundles: history.map((s) => ({ t: s.t, v: s.count })),
      totalFees: history.map((s) => ({ t: s.t, v: s.fees })),
      medianFeeRate: history
        .filter((s) => typeof s.medianFeeRate === "number")
        .map((s) => ({ t: s.t, v: s.medianFeeRate! })),
      available: true,
      windowStartedAt: startedAt,
    };
  }, [history, range, startedAt]);
}

/** XCH/USDT close prices for the range (Gate.io candlesticks); mainnet data regardless of network. */
export function usePriceHistory(range: RangeId) {
  const { hydrated } = useSettings();
  return useQuery({
    queryKey: ["priceHistory", "gate", range],
    enabled: hydrated,
    staleTime: 5 * 60_000,
    retry: 1,
    queryFn: ({ signal }) => fetchPriceHistory(range, signal),
  });
}
