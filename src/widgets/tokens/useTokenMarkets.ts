"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTokenMarkets, type TokenMarketMap } from "@/shared/lib/tokens/markets";
import { useSettings } from "@/shared/providers/SettingsProvider";

export const TOKEN_MARKETS_QUERY_KEY = ["assets", "tokenMarkets"] as const;

/**
 * Every CAT's price and XCH volume in one request of Dexie's tickers (through the nodexch gateway
 * when it is the provider), shared for five minutes.
 */
export function useTokenMarkets() {
  const { dexieFetch, hydrated } = useSettings();
  return useQuery<TokenMarketMap>({
    queryKey: TOKEN_MARKETS_QUERY_KEY,
    enabled: hydrated,
    queryFn: ({ signal }) => fetchTokenMarkets(dexieFetch, signal),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
