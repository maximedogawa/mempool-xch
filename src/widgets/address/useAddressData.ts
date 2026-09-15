"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import type { CoinRecord } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { usePagedTransactions } from "@/widgets/assets/usePagedTransactions";

export interface CoinFallback {
  /** Unspent coins whose puzzle hash is the address (plain XCH). */
  xchCoins: CoinRecord[];
  /** Unspent coins hinted to the address (CATs, NFTs, DIDs wrapped around it); null when the lookup failed. */
  hintedCoins: CoinRecord[] | null;
  xchBalance: bigint;
}

export function useAddressData(p2: string | null) {
  const { client, endpoints } = useSettings();
  const network = endpoints.network;
  const enabled = p2 !== null;
  const indexed = enabled && client.hasIndexed;
  const ph = p2 ?? "";

  const xch = useQuery({
    queryKey: queryKeys.address(network, ph, "xch"),
    queryFn: ({ signal }) => client.getXchBalanceByP2(ph, signal),
    enabled: indexed,
    refetchInterval: 30_000,
  });
  const cats = useQuery({
    queryKey: queryKeys.address(network, ph, "cats"),
    queryFn: ({ signal }) => client.getCatBalancesByP2(ph, signal),
    enabled: indexed,
  });
  const nfts = useQuery({
    queryKey: queryKeys.address(network, ph, "nfts"),
    queryFn: ({ signal }) => client.getNftBalanceByP2(ph, signal),
    enabled: indexed,
  });
  const coins = useQuery({
    queryKey: queryKeys.address(network, ph, "coins"),
    queryFn: async ({ signal }): Promise<CoinFallback> => {
      const [xchCoins, hintedCoins] = await Promise.all([
        client.getCoinRecordsByPuzzleHash(ph, false, signal),
        // Heavy call (hundreds of KB for busy addresses) that Coinset occasionally answers without
        // CORS headers; retry once before giving up so the count is not silently wrong.
        client
          .getCoinRecordsByHint(ph, false, signal)
          .catch(() => new Promise<null>((resolve) => setTimeout(() => resolve(null), 1_500)).then(() => client.getCoinRecordsByHint(ph, false, signal)))
          .catch(() => null),
      ]);
      return { xchCoins, hintedCoins, xchBalance: xchCoins.reduce((s, c) => s + c.coin.amount, 0n) };
    },
    enabled,
    staleTime: 30_000,
  });

  const pending = usePagedTransactions({
    queryKey: useCallback((cursor: string | null) => queryKeys.address(network, ph, "pending", cursor), [network, ph]),
    fetchPage: useCallback((cursor: string | null, limit: number, signal: AbortSignal) => client.getPendingTransactionsByP2(ph, { cursor: cursor ?? undefined, limit }, signal), [client, ph]),
    enabled: indexed,
    refetchInterval: 10_000,
    /** Coinset keeps recently confirmed items in the pending stream for a while; show only truly pending ones. */
    filter: (tx) => tx.status === "pending",
  });
  const history = usePagedTransactions({
    queryKey: useCallback((cursor: string | null) => queryKeys.address(network, ph, "history", cursor), [network, ph]),
    fetchPage: useCallback((cursor: string | null, limit: number, signal: AbortSignal) => client.getTransactionsByP2(ph, { cursor: cursor ?? undefined, limit }, signal), [client, ph]),
    enabled: indexed,
  });

  return { indexed: client.hasIndexed, xch, cats, nfts, coins, pending, history };
}
