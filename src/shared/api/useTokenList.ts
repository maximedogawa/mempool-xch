"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { loadTokenList, type TokenInfo, type TokenMap } from "./tokenList";

export const TOKEN_QUERY_KEY = ["assets", "tokens"] as const;

export const fetchTokenMap = loadTokenList;

/**
 * The CAT token registry, loaded once per session and shared by every component: Dexie's list,
 * through the nodexch gateway when it is the provider.
 */
export function useTokenList() {
  const { dexieFetch, hydrated } = useSettings();
  return useQuery<TokenMap>({
    queryKey: TOKEN_QUERY_KEY,
    queryFn: () => fetchTokenMap(dexieFetch),
    // Who answers (the gateway or Dexie) is known once the stored settings are read.
    enabled: hydrated,
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
  const { dexieFetch, hydrated } = useSettings();
  useEffect(() => {
    if (!hydrated) return;
    void queryClient.prefetchQuery({
      queryKey: TOKEN_QUERY_KEY,
      queryFn: () => fetchTokenMap(dexieFetch),
      staleTime: Infinity,
    });
  }, [queryClient, dexieFetch, hydrated]);
  return null;
}
