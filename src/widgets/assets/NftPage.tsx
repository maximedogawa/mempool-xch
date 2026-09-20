"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useDetailId } from "@/shared/hooks/useDetailId";
import { useCallback, useMemo } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  launcherIdToNftId,
  nftIdToLauncherId,
  puzzleHashToAddress,
} from "@/shared/lib/chia/address";
import { normaliseId32, stripHexPrefix } from "@/shared/lib/chia/hex";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CopyButton,
  EmptyState,
  Hash,
  KindBadge,
  Skeleton,
} from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { CoinsetNotice } from "./CatPage";
import { fetchNftMetadata } from "./nftMetadata";
import { NftOffersCard } from "@/widgets/nft/NftOffersCard";
import { OffersCard } from "@/widgets/offers/OffersCard";
import { TxSummaryList } from "./TxSummaryList";
import { usePagedTransactions } from "./usePagedTransactions";

/** Accepts an nft1… id or a 32-byte launcher id. */
export function resolveNftId(raw: string): { nftId: string; launcherId: string } | null {
  const value = raw.trim().toLowerCase();
  if (value.startsWith("nft1")) {
    const launcherId = nftIdToLauncherId(value);
    return launcherId ? { nftId: value, launcherId } : null;
  }
  const launcherId = normaliseId32(value);
  return launcherId ? { nftId: launcherIdToNftId(launcherId), launcherId } : null;
}

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});

export function NftPage() {
  const raw = useDetailId("nft") ?? "";
  const ids = useMemo(() => resolveNftId(raw), [raw]);
  const { client, endpoints, networkConfig } = useSettings();
  const launcherId = ids?.launcherId ?? "";
  const network = endpoints.network;

  const latest = useQuery({
    queryKey: queryKeys.nft(network, launcherId, "latest"),
    queryFn: ({ signal }) => client.getLatestNftCoinByNftId(launcherId, signal),
    enabled: ids !== null && client.hasIndexed,
  });
  const singleton = useQuery({
    queryKey: queryKeys.nft(network, launcherId, "singleton"),
    queryFn: ({ signal }) => client.getSingletonInfo(launcherId, signal),
    enabled: ids !== null && client.hasIndexed,
  });
  const metadata = useQuery({
    queryKey: queryKeys.nft(network, launcherId, "metadata"),
    queryFn: () => fetchNftMetadata(ids?.nftId ?? ""),
    enabled: ids !== null && network === "mainnet",
    staleTime: 10 * 60_000,
    retry: false,
  });
  const history = usePagedTransactions({
    queryKey: useCallback(
      (cursor: string | null) => queryKeys.nft(network, launcherId, "history", cursor),
      [network, launcherId]
    ),
    fetchPage: useCallback(
      (cursor: string | null, limit: number, signal: AbortSignal) =>
        client.getTransactionsByNftId(launcherId, { cursor: cursor ?? undefined, limit }, signal),
      [client, launcherId]
    ),
    enabled: ids !== null && client.hasIndexed,
  });

  if (!ids) {
    return (
      <EmptyState
        tone="danger"
        title="Not a valid NFT id"
        description={`Expected an nft1… id or a 32-byte launcher id. Got: ${raw || "(empty)"}`}
      />
    );
  }

  const latestRecord = latest.data;
  const ownerP2 =
    (typeof latestRecord?.p2 === "string" ? stripHexPrefix(latestRecord.p2) : null) ??
    metadata.data?.ownerP2 ??
    null;
  const ownerAddress = ownerP2 ? puzzleHashToAddress(ownerP2, networkConfig.addressPrefix) : null;
  const coinRecord = obj(latestRecord?.coin_record ?? singleton.data?.coinRecord);
  const coin = obj(coinRecord.coin);
  const royalty = obj(latestRecord?.royalty);
  const royaltyBps =
    typeof royalty.royalty_basis_points === "number"
      ? royalty.royalty_basis_points
      : metadata.data?.royaltyBasisPoints;
  const name =
    metadata.data?.name ?? (metadata.isLoading ? null : `NFT ${ids.nftId.slice(0, 12)}…`);
  const confirmedAt = typeof coinRecord.timestamp === "number" ? coinRecord.timestamp * 1000 : null;

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader title="NFT" action={<KindBadge kind="nft" />} />
        <CardBody className="grid grid-cols-1 gap-5 md:grid-cols-[280px_minmax(0,1fr)]">
          <AssetImage
            urls={metadata.data?.imageUrls ?? []}
            alt={name ?? "NFT image"}
            sensitivity={metadata.data?.sensitivity}
            videoUrl={metadata.data?.videoUrl}
            className="aspect-square w-full max-w-[280px] justify-self-center md:justify-self-start"
          />
          <div className="flex min-w-0 flex-col gap-3">
            <div>
              <h1 className="text-2xl font-semibold">
                {name ?? <Skeleton className="h-7 w-48" />}
              </h1>
              {metadata.data?.collectionName ? (
                <p className="text-sm text-fg-muted">Collection: {metadata.data.collectionName}</p>
              ) : null}
              {metadata.data?.description ? (
                <p className="mt-1 line-clamp-4 text-sm text-fg-faint [overflow-wrap:anywhere]">
                  {metadata.data.description}
                </p>
              ) : null}
              {!metadata.isLoading && !metadata.data && network === "mainnet" ? (
                <p className="text-xs text-fg-faint">Metadata not available from MintGarden.</p>
              ) : null}
              {network !== "mainnet" ? (
                <p className="text-xs text-fg-faint">NFT metadata lookup is mainnet only.</p>
              ) : null}
            </div>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  NFT id
                </dt>
                <dd className="mono flex items-center gap-1 break-all">
                  {ids.nftId}
                  <CopyButton value={ids.nftId} />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Launcher id
                </dt>
                <dd className="mono flex items-center gap-1 break-all text-xs text-fg-muted">
                  0x{ids.launcherId}
                  <CopyButton value={`0x${ids.launcherId}`} />
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Current owner
                </dt>
                <dd className="mono break-all">
                  {ownerAddress ? (
                    <Link
                      href={routes.address(ownerAddress)}
                      className="text-accent hover:underline"
                    >
                      {ownerAddress}
                    </Link>
                  ) : latest.isLoading || metadata.isLoading ? (
                    <Skeleton className="h-5 w-64" />
                  ) : (
                    <span className="text-fg-faint">
                      unknown{!client.hasIndexed ? " (needs Coinset)" : ""}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Current coin
                </dt>
                <dd>
                  {typeof coin.puzzle_hash === "string" &&
                  typeof coin.parent_coin_info === "string" ? (
                    <Hash value={stripHexPrefix(String(coin.parent_coin_info))} head={8} tail={6} />
                  ) : (
                    <span className="text-fg-faint">—</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Last moved
                </dt>
                <dd className="tabular">
                  {confirmedAt ? `${formatAge(confirmedAt)} · ${formatDateTime(confirmedAt)}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Royalty
                </dt>
                <dd className="tabular">
                  {royaltyBps !== null && royaltyBps !== undefined
                    ? `${(royaltyBps / 100).toFixed(2)}%`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  Standard
                </dt>
                <dd>
                  <Badge tone="nft">
                    {typeof latestRecord?.nft_standard === "string"
                      ? latestRecord.nft_standard
                      : "NFT1"}
                  </Badge>
                </dd>
              </div>
            </dl>
            {network === "mainnet" ? (
              <a
                href={`https://mintgarden.io/nfts/${ids.nftId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                View on MintGarden <ExternalLink size={12} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </CardBody>
      </Card>

      <NftOffersCard nftId={ids.nftId} enabled={network === "mainnet"} />
      <OffersCard scope={{ kind: "nft", nftId: ids.nftId }} title="Offer history on chain" />

      <Card>
        <CardHeader title="Transfer history" />
        <CardBody>
          {client.hasIndexed ? (
            <TxSummaryList
              transactions={history.transactions}
              loading={history.isLoading}
              error={history.error}
              emptyText="No transfers indexed for this NFT."
              hasMore={history.hasMore}
              onLoadMore={history.loadMore}
              loadingMore={history.loadingMore}
            />
          ) : (
            <CoinsetNotice what="transfers by NFT id and the current owner are indexed queries" />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
