"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import type { TxList, TxSummary } from "@/shared/lib/rpc/types";

/**
 * Cursor pagination over a Coinset transaction list: accumulates pages in state and exposes
 * "load more". The first page is refetched on invalidation (live events) and replaces the
 * accumulated list when it changes at the top.
 */
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
  /** Optional client-side filter applied to every page. */
  filter?: (tx: TxSummary) => boolean;
}) {
  const queryClient = useQueryClient();
  const [extra, setExtra] = useState<TxSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const first = useQuery({
    queryKey: queryKey(null),
    queryFn: ({ signal }) => fetchPage(null, pageSize, signal),
    enabled,
    refetchInterval,
  });

  // Reset accumulated pages when the underlying key (network / id) changes.
  const keyString = JSON.stringify(queryKey(null));
  useEffect(() => {
    setExtra([]);
    setCursor(null);
  }, [keyString]);

  useEffect(() => {
    if (first.data && cursor === null && extra.length === 0) setCursor(first.data.nextCursor);
  }, [first.data, cursor, extra.length]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await queryClient.fetchQuery({
        queryKey: queryKey(cursor),
        queryFn: ({ signal }) => fetchPage(cursor, pageSize, signal),
        staleTime: 60_000,
      });
      setExtra((prev) => [...prev, ...page.transactions]);
      setCursor(page.transactions.length > 0 ? page.nextCursor : null);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, queryClient, queryKey, fetchPage, pageSize]);

  const seen = new Set<string>();
  const transactions = [...(first.data?.transactions ?? []), ...extra].filter((tx) => {
    if (filter && !filter(tx)) return false;
    if (seen.has(tx.id)) return false;
    seen.add(tx.id);
    return true;
  });
  return { transactions, isLoading: first.isLoading, error: first.error, hasMore: cursor !== null && (first.data?.truncated ?? false) || (cursor !== null && extra.length > 0), loadMore, loadingMore };
}
