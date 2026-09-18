"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

export interface Page<T> {
  items: T[];
  truncated: boolean;
  nextCursor: string | null;
}

/**
 * Cursor pagination over any Coinset list (offers, clawbacks, reorgs): the generic twin of
 * usePagedTransactions. Accumulates pages in state, exposes "load more", and refetches the
 * first page on invalidation.
 */
export function usePagedList<T>({
  queryKey,
  fetchPage,
  enabled,
  refetchInterval,
  pageSize = 25,
  itemKey,
}: {
  queryKey: (cursor: string | null) => readonly unknown[];
  fetchPage: (cursor: string | null, limit: number, signal: AbortSignal) => Promise<Page<T>>;
  enabled: boolean;
  refetchInterval?: number;
  pageSize?: number;
  itemKey: (item: T) => string;
}) {
  const queryClient = useQueryClient();
  const [extra, setExtra] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const first = useQuery({
    queryKey: queryKey(null),
    queryFn: ({ signal }) => fetchPage(null, pageSize, signal),
    enabled,
    refetchInterval,
  });

  const keyString = JSON.stringify(queryKey(null));
  useEffect(() => {
    setExtra([]);
    setCursor(null);
  }, [keyString]);

  useEffect(() => {
    if (first.data && cursor === null && extra.length === 0)
      setCursor(first.data.truncated ? first.data.nextCursor : null);
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
      setExtra((prev) => [...prev, ...page.items]);
      setCursor(page.items.length > 0 && page.truncated ? page.nextCursor : null);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, queryClient, queryKey, fetchPage, pageSize]);

  const seen = new Set<string>();
  const items = [...(first.data?.items ?? []), ...extra].filter((item) => {
    const key = itemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    items,
    isLoading: first.isLoading,
    error: first.error,
    hasMore: cursor !== null,
    loadMore,
    loadingMore,
  };
}
