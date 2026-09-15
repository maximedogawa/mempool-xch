"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import type { CoinTxLinks } from "@/shared/lib/rpc/client";
import { isNotFound, isRpcError } from "@/shared/lib/rpc/errors";
import type { CoinDetails, CoinRecord, MempoolItem } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";

export type { CoinTxLinks } from "@/shared/lib/rpc/client";

export function useCoinRecord(id: string | null) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.coin(endpoints.network, id ?? ""),
    enabled: id !== null,
    queryFn: ({ signal }) => client.getCoinRecordByName(id ?? "", signal),
    refetchInterval: (query) => (query.state.data && !query.state.data.spent ? 20_000 : false),
  });
}

export function useCoinDetails(id: string | null) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.coinDetails(endpoints.network, id ?? ""),
    enabled: id !== null && client.hasIndexed,
    retry: false,
    queryFn: async ({ signal }): Promise<{ details: CoinDetails | null; links: CoinTxLinks | null }> => {
      const coinName = id ?? "";
      const details = await client.getCoinDetails(coinName, signal).catch((error: unknown) => {
        if (isNotFound(error) || isRpcError(error, "http") || isRpcError(error, "malformed")) return null;
        throw error;
      });
      const links = details
        ? { createdInTxId: details.createdInTxId, spentInTxId: details.spentInTxId, createdTransaction: details.createdTransaction, spentTransaction: details.spentTransaction }
        : await client.getTransactionsByCoinName(coinName, signal).catch(() => null);
      return { details, links };
    },
  });
}

export function useCoinChildren(id: string | null) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.coinChildren(endpoints.network, id ?? ""),
    enabled: id !== null,
    queryFn: ({ signal }): Promise<CoinRecord[]> => client.getCoinRecordsByParentIds([id ?? ""], true, signal),
  });
}

export function useCoinMempoolSpends(id: string | null, enabled: boolean) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.mempoolByCoin(endpoints.network, id ?? ""),
    enabled: id !== null && enabled,
    refetchInterval: 10_000,
    queryFn: ({ signal }): Promise<MempoolItem[]> => client.getMempoolItemsByCoinName(id ?? "", signal).catch((error: unknown) => {
      if (isNotFound(error) || isRpcError(error, "rpc")) return [];
      throw error;
    }),
  });
}
