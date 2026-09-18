"use client";

import { useQuery } from "@tanstack/react-query";
import { useMempoolSummary } from "@/shared/api/hooks";
import { queryKeys } from "@/shared/api/queryKeys";
import { bracketDistribution } from "@/shared/lib/fees/brackets";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** 1, 2, 5, 10 and 30 minutes, in seconds — parity with xchmempool.com/fees. */
export const TARGET_TIMES_S = [60, 120, 300, 600, 1800] as const;
/** The page's own reference cost, matching the "plain transfer" row of the cost table. */
export const FEES_PAGE_REFERENCE_COST = 11_000_000;

export function useFeeEstimateTargets() {
  const { client, endpoints, hydrated } = useSettings();
  return useQuery({
    queryKey: [
      ...queryKeys.fee(endpoints.network),
      "targets",
      FEES_PAGE_REFERENCE_COST,
      ...TARGET_TIMES_S,
    ],
    enabled: hydrated,
    queryFn: ({ signal }) =>
      client.getFeeEstimate(FEES_PAGE_REFERENCE_COST, [...TARGET_TIMES_S], signal),
    refetchInterval: 45_000,
  });
}

export function useRateBracketDistribution() {
  const summary = useMempoolSummary();
  return {
    rows: summary.data ? bracketDistribution(summary.data.items) : null,
    isLoading: summary.isLoading,
  };
}
