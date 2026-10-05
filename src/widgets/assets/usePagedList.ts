"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

export interface Page<T> {
  items: T[];
  truncated: boolean;
  nextCursor: string | null;
}

/** Pages belong to their query identity; late responses never append to another list. */
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
  const query = useInfiniteQuery({
    // Keep infinite data distinct from single-page queries using the same family.
    queryKey: [...queryKey(null), "pages", pageSize],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, pageSize, signal),
    getNextPageParam: (last, _pages, previous, cursors) =>
      last.items.length > 0 &&
      last.truncated &&
      last.nextCursor &&
      last.nextCursor !== previous &&
      !cursors.includes(last.nextCursor)
        ? last.nextCursor
        : undefined,
    enabled,
    refetchInterval,
  });
  const seen = new Set<string>();
  const items = (query.data?.pages.flatMap((page) => page.items) ?? []).filter((item) => {
    const key = itemKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    items,
    isLoading: query.isLoading,
    error: query.error,
    hasMore: query.hasNextPage,
    loadMore: async () => {
      if (enabled && query.hasNextPage && !query.isFetching) await query.fetchNextPage();
    },
    loadingMore: query.isFetchingNextPage,
  };
}
