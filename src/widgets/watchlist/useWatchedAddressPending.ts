"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import type { NetworkId } from "@/shared/config/networks";
import type { RpcClient } from "@/shared/lib/rpc/client";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** Shared by watchlist rows and block markers; a single request serves both. */
export function watchedAddressOptions(
  client: RpcClient,
  network: NetworkId,
  p2: string,
  history = false
) {
  return queryOptions({
    queryKey: [
      ...queryKeys.address(network, p2, history ? "watchlistHistory" : "watchlistPending"),
      client.rpcUrl,
    ],
    enabled: client.hasIndexed,
    staleTime: history ? 30_000 : 10_000,
    refetchInterval: history ? 30_000 : 10_000,
    queryFn: ({ signal }) =>
      history
        ? client.getTransactionsByP2(p2, { limit: 25 }, signal)
        : client.getPendingTransactionsByP2(p2, { limit: 25 }, signal),
  });
}

export function useWatchedAddressPending(p2: string) {
  const { client, endpoints } = useSettings();
  return useQuery(watchedAddressOptions(client, endpoints.network, p2));
}

export function useWatchedAddressHistory(p2: string) {
  const { client, endpoints } = useSettings();
  return useQuery(watchedAddressOptions(client, endpoints.network, p2, true));
}
