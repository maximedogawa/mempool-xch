"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { loadTokenList, type TokenInfo, type TokenMap } from "./tokenList";

export const TOKEN_QUERY_KEY = ["assets", "tokens"] as const;

export const fetchTokenMap = loadTokenList;

/** The CAT token registry, loaded once per session (Dexie) and shared by every component. */
export function useTokenList() {
  return useQuery<TokenMap>({
    queryKey: TOKEN_QUERY_KEY,
    queryFn: () => fetchTokenMap(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}

/** One asset from the registry by id (hex, with or without 0x), or undefined while loading/unknown. */
export function useAsset(assetId: string | null | undefined): TokenInfo | undefined {
  const tokens = useTokenList();
  if (!assetId) return undefined;
  return tokens.data?.[assetId.toLowerCase().replace(/^0x/, "")];
}

/** Kicks off the registry load at app start so the first badge already has icons. */
export function AssetRegistryLoader() {
  const queryClient = useQueryClient();
  useEffect(() => {
    void queryClient.prefetchQuery({
      queryKey: TOKEN_QUERY_KEY,
      queryFn: () => fetchTokenMap(),
      staleTime: Infinity,
    });
  }, [queryClient]);
  return null;
}
