"use client";

import { useQuery } from "@tanstack/react-query";
import { loadTokenList, type TokenMap } from "@/shared/api/tokenList";

/** Spacescan token list, once per session (cached a day in localStorage). */
export function useTokenList() {
  return useQuery<TokenMap>({
    queryKey: ["tokenList"],
    queryFn: () => loadTokenList(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });
}
