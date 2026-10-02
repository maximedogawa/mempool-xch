"use client";

import type { TxList, TxSummary } from "@/shared/lib/rpc/types";
import { usePagedList } from "./usePagedList";

/** Shared cursor pagination for transaction histories and live pending lists. */
export function usePagedTransactions({
  queryKey,
  fetchPage,
  enabled,
  refetchInterval,
  pageSize = 25,
  filter,
}: {
  queryKey: (cursor: string | null) => readonly unknown[];
  fetchPage: (cursor: string | null, limit: number, signal: AbortSignal) => Promise<TxList>;
  enabled: boolean;
  refetchInterval?: number;
  pageSize?: number;
  filter?: (tx: TxSummary) => boolean;
}) {
  const { items, ...rest } = usePagedList({
    queryKey,
    fetchPage: async (cursor, limit, signal) => {
      const page = await fetchPage(cursor, limit, signal);
      return { items: page.transactions, truncated: page.truncated, nextCursor: page.nextCursor };
    },
    enabled,
    refetchInterval,
    pageSize,
    itemKey: (tx) => tx.id,
  });
  return { ...rest, transactions: filter ? items.filter(filter) : items };
}
