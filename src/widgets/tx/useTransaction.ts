"use client";

import { queryOptions, useQuery } from "@tanstack/react-query";
import type { NetworkId } from "@/shared/config/networks";
import type { RpcClient } from "@/shared/lib/rpc/client";
import type { RawTransaction } from "@/shared/lib/rpc/types";
import { queryKeys } from "@/shared/api/queryKeys";
import { classifyMempoolItem } from "@/shared/lib/mempool/classify";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import { isNotFound, isRpcError } from "@/shared/lib/rpc/errors";
import type { MempoolItem, TxSummary } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";

export type TransactionView =
  | {
      status: "pending";
      item: MempoolItem | null;
      kind: TxKindHint;
      assetIds: string[];
      summary: TxSummary | null;
    }
  | { status: "confirmed" | "removed"; summary: TxSummary; item: null }
  | { status: "not_found"; item: null; summary: null };

/**
 * One query for both worlds: the mempool item wins while the bundle is pending; otherwise the
 * Coinset summary (confirmed or removed) or a not-found view. Refetches every 10 s while pending
 * so confirmation shows up even without the live stream.
 */
export function transactionOptions(client: RpcClient, network: NetworkId, id: string | null) {
  return queryOptions({
    queryKey: [...queryKeys.tx(network, id ?? ""), client.rpcUrl, client.indexedUrl],
    enabled: id !== null,
    queryFn: async ({ signal }): Promise<TransactionView> => {
      const txId = id ?? "";
      const [item, summary] = await Promise.all([
        client.getMempoolItemByTxId(txId, signal).catch((error: unknown) => {
          if (
            isNotFound(error) ||
            (isRpcError(error, "rpc") && /not in (?:the )?mempool/i.test(error.message))
          )
            return null;
          throw error;
        }),
        client.hasIndexed
          ? client.getTransaction(txId, signal).catch((error: unknown) => {
              if (isNotFound(error) || (isRpcError(error, "http") && error.status === 404))
                return null;
              throw error;
            })
          : Promise.resolve(null),
      ]);
      // Coinset still answers get_mempool_item_by_tx_id for recently confirmed bundles, so the
      // indexed summary decides the status whenever it knows the transaction is settled.
      if (item && (!summary || summary.status === "pending")) {
        const { kind, assetIds } = classifyMempoolItem(item);
        return { status: "pending", item, kind, assetIds, summary };
      }
      if (summary?.status === "pending") {
        return { status: "pending", item: null, summary, kind: "unknown", assetIds: [] };
      }
      if (summary)
        return {
          status: summary.status === "removed" ? "removed" : "confirmed",
          summary,
          item: null,
        };
      return { status: "not_found", item: null, summary: null };
    },
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 10_000 : false),
  });
}

export function useTransaction(id: string | null) {
  const { client, endpoints } = useSettings();
  return useQuery(transactionOptions(client, endpoints.network, id));
}

/**
 * The mempool-style item of a bundle that already left the mempool (confirmed or dropped):
 * Coinset keeps it (source "mempool") or rebuilds it from the block generator ("inferred").
 * Only asked for once the summary says the transaction is settled; never on custom nodes.
 */
export function useRawTransaction(id: string | null, enabled: boolean) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: [...queryKeys.tx(endpoints.network, id ?? ""), "raw"],
    enabled: id !== null && enabled && client.hasIndexed,
    staleTime: Infinity,
    retry: false,
    queryFn: async ({ signal }): Promise<RawTransaction | null> => {
      try {
        return await client.getRawTransactionById(id ?? "", signal);
      } catch (error) {
        if (isNotFound(error) || isRpcError(error, "http") || isRpcError(error, "rpc")) return null;
        throw error;
      }
    },
  });
}
