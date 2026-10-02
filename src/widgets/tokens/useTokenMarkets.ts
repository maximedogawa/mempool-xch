"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTokenMarkets, type TokenMarketMap } from "@/shared/lib/tokens/markets";

export const TOKEN_MARKETS_QUERY_KEY = ["assets", "tokenMarkets"] as const;

/** Every CAT's price and XCH volume in one Dexie request, shared for five minutes. */
export function useTokenMarkets() {
  return useQuery<TokenMarketMap>({
    queryKey: TOKEN_MARKETS_QUERY_KEY,
    queryFn: ({ signal }) => fetchTokenMarkets((url, init) => fetch(url, init), signal),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
