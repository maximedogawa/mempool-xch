"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { routes } from "@/shared/lib/routes";
import { Button, Card, CardBody, CardHeader, Skeleton } from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { ADDRESS_NFT_PAGE_SIZE, fetchAddressNfts, type NftOwner } from "./fetchAddressNfts";

/** At most 20 cards mounted. No prefetch, full-wallet enumeration or per-NFT metadata calls. */
export function AddressNfts({ owner }: { owner: NftOwner }) {
  const { hydrated } = useSettings();
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [collection, setCollection] = useState("");
  const [collections, setCollections] = useState<Record<string, string>>({});
  const cursor = cursors[page] ?? null;
  const query = useQuery({
    queryKey: [
      ...queryKeys.address("mainnet", owner.id, "nftGallery"),
      owner.kind,
      collection,
      cursor,
    ],
    queryFn: ({ signal }) => fetchAddressNfts(owner, cursor, collection, signal),
    enabled: hydrated,
    staleTime: 5 * 60_000,
    gcTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  useEffect(() => {
    if (!query.data) return;
    setCollections((previous) => {
      const next = { ...previous };
      for (const nft of query.data.items)
        if (nft.collectionId) next[nft.collectionId] = nft.collectionName ?? nft.collectionId;
      return next;
    });
  }, [query.data]);
  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase();
    return (query.data?.items ?? []).filter(
      (nft) =>
        !text || `${nft.name} ${nft.id} ${nft.collectionName ?? ""}`.toLowerCase().includes(text)
    );
  }, [query.data, search]);
  const next = query.data?.next;
  const canNext = !!next && !cursors.slice(0, page + 1).includes(next);
  const setFilter = (value: string) => {
    setCollection(value);
    setCursors([null]);
    setPage(0);
    setSearch("");
  };
  return (
    <Card role="region" aria-label={owner.kind === "did" ? "DID NFTs" : "Address NFTs"}>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <ImageIcon size={16} aria-hidden="true" />
            NFTs held
          </span>
        }
        action={
          <span className="text-xs text-fg-faint">
            {ADDRESS_NFT_PAGE_SIZE} per page · MintGarden
          </span>
        }
      />
      <CardBody className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Filter NFTs on this page</span>
            <Search size={15} aria-hidden="true" className="absolute left-3 top-3 text-fg-faint" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter this page by name or NFT ID"
              className="h-10 w-full rounded-lg border border-border bg-bg pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label>
            <span className="sr-only">Filter NFTs by collection</span>
            <select
              aria-label="Filter NFTs by collection"
              value={collection}
              onChange={(e) => setFilter(e.target.value)}
              className="h-10 w-full max-w-full rounded-lg border border-border bg-bg px-3 text-sm outline-none focus:border-primary sm:max-w-64"
            >
              <option value="">All collections</option>
              {Object.entries(collections)
                .sort((a, b) => a[1].localeCompare(b[1]))
                .map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="text-xs text-fg-faint">
          Search filters this page. Choose a collection seen on a visited page to browse all its
          holdings.
        </p>
        {query.isError ? (
          <div
            role="alert"
            className="flex items-center justify-between gap-3 rounded-lg border border-danger/30 p-3 text-sm text-danger"
          >
            <span>Could not load NFTs.</span>
            <Button size="sm" onClick={() => void query.refetch()}>
              Retry
            </Button>
          </div>
        ) : query.isPending ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        ) : filtered.length ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {filtered.map((nft) => (
              <li
                key={nft.id}
                className="min-w-0 overflow-hidden rounded-xl border border-border bg-bg/50"
              >
                <AssetImage
                  urls={nft.thumbnailUrl ? [nft.thumbnailUrl] : []}
                  alt={nft.name}
                  className="aspect-square w-full"
                  rounded="rounded-none"
                  sensitivity={nft.sensitivity}
                />
                <div className="p-3">
                  <Link
                    href={routes.nft(nft.id)}
                    prefetch={false}
                    title={nft.name}
                    className="block truncate text-sm font-semibold text-fg hover:text-primary"
                  >
                    {nft.name}
                  </Link>
                  <p
                    className="mt-1 truncate text-xs text-fg-faint"
                    title={nft.collectionName ?? undefined}
                  >
                    {nft.collectionName ?? "No collection"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-fg-muted">
            {search
              ? "No NFTs match on this page. Try another page or clear the filter."
              : "No NFTs on this page."}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <span role="status" className="tabular text-xs text-fg-muted">
            Page {page + 1}
            {query.data ? ` · ${filtered.length} shown` : ""}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={page === 0 || query.isFetching}
              onClick={() => {
                setPage((value) => value - 1);
                setSearch("");
              }}
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Previous
            </Button>
            <Button
              size="sm"
              disabled={!canNext || query.isFetching || query.isError}
              onClick={() => {
                if (!next) return;
                setCursors((previous) => [...previous.slice(0, page + 1), next]);
                setPage((value) => value + 1);
                setSearch("");
              }}
            >
              Next {ADDRESS_NFT_PAGE_SIZE}
              <ChevronRight size={14} aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
