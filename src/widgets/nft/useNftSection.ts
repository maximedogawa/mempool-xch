"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchCollections,
  fetchNftEvents,
  fetchNftOffers,
  type CollectionInterval,
  type NftEventKind,
} from "@/shared/lib/nft/mintgarden";

export function useTopCollections(interval: CollectionInterval = "30", size = 10) {
  return useQuery({
    queryKey: ["nftSection", "collections", interval, size],
    queryFn: () => fetchCollections({ interval, size }),
    staleTime: 5 * 60_000,
  });
}

export function useCollectionsList(interval: CollectionInterval, search: string) {
  return useInfiniteQuery({
    queryKey: ["nftSection", "collectionsList", interval, search],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchCollections({ interval, search: search || undefined, page: pageParam, size: 25 }),
    getNextPageParam: (last) => last.next ?? undefined,
    staleTime: 5 * 60_000,
  });
}

export function useNftEvents(kinds: NftEventKind[] | undefined, size = 25) {
  return useInfiniteQuery({
    queryKey: ["nftSection", "events", kinds?.join(",") ?? "all", size],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchNftEvents({ kinds, page: pageParam, size }),
    getNextPageParam: (last) => last.next ?? undefined,
    staleTime: 60_000,
  });
}

export function useNftOffers(nftId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["nftSection", "offers", nftId],
    queryFn: () => fetchNftOffers(nftId),
    enabled,
    staleTime: 60_000,
  });
}
