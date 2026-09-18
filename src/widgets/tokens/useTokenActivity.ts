"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { createLimiter } from "@/shared/lib/limit";
import { summariseRecentActivity, type TokenActivitySample } from "@/shared/lib/tokens/activity";
import { useSettings } from "@/shared/providers/SettingsProvider";

export const RECENT_SAMPLE = 10;

/** At most this many per-asset activity fan-outs in flight per tab (visible table rows). */
const rowLimit = createLimiter(6);

/**
 * Bounded per-token activity: one exact ascending, limit-1 lookup for the first
 * transaction Coinset has, and a capped recent page for last-seen, a sampled spend count and a
 * sampled (not all-time) volume moved. No full-history pagination, so this is safe to fetch for
 * every row on a visible table page.
 */
export function useTokenActivity(assetId: string, enabled: boolean) {
  const { client, endpoints } = useSettings();
  const active = enabled && client.hasIndexed;

  const first = useQuery({
    queryKey: queryKeys.cat(endpoints.network, assetId, "activityFirst"),
    enabled: active,
    staleTime: Infinity,
    queryFn: ({ signal }) =>
      rowLimit(
        async () =>
          (await client.getTransactionsByCatAssetId(assetId, { limit: 1, order: "asc" }, signal))
            .transactions[0]?.confirmedAtMs ?? null
      ),
  });
  const recent = useQuery({
    queryKey: queryKeys.cat(endpoints.network, assetId, "activityRecent"),
    enabled: active,
    staleTime: 2 * 60 * 1000,
    queryFn: ({ signal }) =>
      rowLimit(async () => {
        const page = await client.getTransactionsByCatAssetId(
          assetId,
          { limit: RECENT_SAMPLE, order: "desc" },
          signal
        );
        return summariseRecentActivity(assetId, page.transactions, page.nextCursor !== null);
      }),
  });

  const data: TokenActivitySample | null =
    first.isSuccess && recent.data ? { firstSeenMs: first.data, ...recent.data } : null;
  return {
    data,
    isLoading: active && (first.isLoading || recent.isLoading),
    available: client.hasIndexed,
  };
}
