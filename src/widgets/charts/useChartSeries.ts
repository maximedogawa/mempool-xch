"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useBlockchainState } from "@/shared/api/hooks";
import { queryKeys } from "@/shared/api/queryKeys";
import { blockWindowSeries } from "@/shared/lib/charts/aggregate";
import {
  bucketHeight,
  heightWindows,
  oldestHeightForRange,
  rangeById,
  type RangeId,
} from "@/shared/lib/charts/range";
import type { Point } from "@/shared/lib/charts/smoothing";
import { createLimiter } from "@/shared/lib/limit";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { useMempoolHistory } from "@/widgets/mempool/useMempoolHistory";

const windowsLimit = createLimiter(4);

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

export function useNetworkChartSeries(range: RangeId) {
  const { client, endpoints, hydrated } = useSettings();
  const windows = useChartBlockWindows(range);
  const blocksPerHour = useMemo(
    () => (windows.data ? blockWindowSeries(windows.data).blocksPerHour : []),
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
    blocksPerHour,
    isLoading: windows.isLoading || netspace.isLoading,
    error: windows.error ?? netspace.error,
  };
}

export interface MempoolChartSeries {
  /** Total pending cost across the mempool, mojo-cost units. */
  costUsed: Point[];
  waitingBundles: Point[];
  totalFees: Point[];
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
        available: false,
        windowStartedAt: startedAt,
      };
    return {
      costUsed: history.map((s) => ({ t: s.t, v: s.bands.reduce((a, b) => a + b, 0) })),
      waitingBundles: history.map((s) => ({ t: s.t, v: s.count })),
      totalFees: history.map((s) => ({ t: s.t, v: s.fees })),
      available: true,
      windowStartedAt: startedAt,
    };
  }, [history, range, startedAt]);
}
