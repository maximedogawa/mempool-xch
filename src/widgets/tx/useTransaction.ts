"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { classifyMempoolItem } from "@/shared/lib/mempool/classify";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import { isNotFound, isRpcError } from "@/shared/lib/rpc/errors";
import type { MempoolItem, TxSummary } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";

export type TransactionView =
  | { status: "pending"; item: MempoolItem; kind: TxKindHint; assetIds: string[]; summary: TxSummary | null }
  | { status: "confirmed" | "removed"; summary: TxSummary; item: null }
  | { status: "not_found"; item: null; summary: null };

/**
 * One query for both worlds: the mempool item wins while the bundle is pending; otherwise the
 * Coinset summary (confirmed or removed) or a not-found view. Refetches every 10 s while pending
 * so confirmation shows up even without the live stream.
 */
export function useTransaction(id: string | null) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.tx(endpoints.network, id ?? ""),
    enabled: id !== null,
    queryFn: async ({ signal }): Promise<TransactionView> => {
      const txId = id ?? "";
      const [item, summary] = await Promise.all([
        client.getMempoolItemByTxId(txId, signal).catch((error: unknown) => {
          if (isNotFound(error) || isRpcError(error, "rpc")) return null;
          throw error;
        }),
        client.hasIndexed
          ? client.getTransaction(txId, signal).catch((error: unknown) => {
              if (isNotFound(error) || isRpcError(error, "http")) return null;
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
      if (summary) return { status: summary.status === "removed" ? "removed" : "confirmed", summary, item: null };
      return { status: "not_found", item: null, summary: null };
    },
    refetchInterval: (query) => (query.state.data?.status === "pending" ? 10_000 : false),
  });
}
