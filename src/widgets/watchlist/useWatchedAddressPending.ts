"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** Pending transactions for a watched address, refreshed the same way the address page does. */
export function useWatchedAddressPending(p2: string) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.address(endpoints.network, p2, "watchlistPending"),
    enabled: client.hasIndexed,
    refetchInterval: 10_000,
    queryFn: ({ signal }) => client.getPendingTransactionsByP2(p2, {}, signal),
  });
}
