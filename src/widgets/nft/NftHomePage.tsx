"use client";

import Link from "next/link";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { routes } from "@/shared/lib/routes";
import { Card, CardBody, CardHeader, EmptyState, Skeleton, StatTile } from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { formatXchDecimal } from "./format";
import { NftEventRow } from "./NftEventRow";
import { useNftEvents, useTopCollections } from "./useNftSection";

export function NftHomePage() {
  const collections = useTopCollections("30", 6);
  const activity = useNftEvents(undefined, 8);
  const mints = useNftEvents(["mint"], 6);

  const totalVolume30d = collections.data?.collections.reduce((sum, c) => sum + (c.volumeXch ?? 0), 0) ?? 0;
  const totalTrades30d = collections.data?.collections.reduce((sum, c) => sum + (c.tradeCount ?? 0), 0) ?? 0;
  const activityEvents = activity.data?.pages.flatMap((p) => p.events) ?? [];
  const mintEvents = mints.data?.pages.flatMap((p) => p.events) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">NFTs</h1>
        <p className="text-sm text-fg-muted">
          Collections, activity and mints from MintGarden (mainnet only) and open offers from Dexie — read on request, nothing stored on our server
          (decision-012). Figures below are the top 6 collections by 30-day volume, not a platform-wide total: neither provider publishes one.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Top collections, 30d volume" value={collections.data ? formatXchDecimal(totalVolume30d) : <Skeleton className="h-6 w-20" />} hint="Sum of the 6 busiest collections' 30-day trade volume." />
        <StatTile label="Trades, top collections" value={collections.data ? formatNumber(totalTrades30d) : <Skeleton className="h-6 w-16" />} />
        <StatTile label="Recent activity" value={activity.data ? formatNumber(activityEvents.length) : <Skeleton className="h-6 w-12" />} sub="events shown below" />
        <StatTile label="Recent mints" value={mints.data ? formatNumber(mintEvents.length) : <Skeleton className="h-6 w-12" />} sub="mints shown below" />
      </div>

      <Card>
        <CardHeader title="Collections in the spotlight" action={<Link href={routes.nftCollections()} className="text-xs text-accent hover:underline">All collections →</Link>} />
        <CardBody>
          {collections.error ? (
            <EmptyState tone="danger" title="Could not load collections" description="MintGarden did not answer." />
          ) : collections.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-square w-full" />
              ))}
            </div>
          ) : collections.data && collections.data.collections.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {collections.data.collections.map((c) => (
                <a key={c.id} href={`https://mintgarden.io/collections/${c.id}`} target="_blank" rel="noreferrer" className="group flex flex-col gap-1.5">
                  <AssetImage urls={c.thumbnailUrl ? [c.thumbnailUrl] : []} alt={c.name ?? "collection"} className="aspect-square w-full" />
                  <span className="truncate text-xs font-medium group-hover:text-accent">{c.name ?? "Untitled"}</span>
                  <span className="tabular text-[11px] text-fg-faint">{c.floorPriceXch !== null ? `${formatXchDecimal(c.floorPriceXch)} floor` : "no floor"}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-fg-faint">No collection data available.</p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent activity" action={<Link href={routes.nftActivity()} className="text-xs text-accent hover:underline">All activity →</Link>} />
          <CardBody>
            {activity.error ? (
              <EmptyState tone="danger" title="Could not load activity" description="MintGarden did not answer." />
            ) : activity.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : activityEvents.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {activityEvents.map((e) => (
                  <NftEventRow key={`${e.nftId}-${e.blockHeight}-${e.kind}`} event={e} />
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-fg-faint">No recent activity.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="New mints" action={<Link href={routes.nftMints()} className="text-xs text-accent hover:underline">All mints →</Link>} />
          <CardBody>
            {mints.error ? (
              <EmptyState tone="danger" title="Could not load mints" description="MintGarden did not answer." />
            ) : mints.isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : mintEvents.length > 0 ? (
              <ul className="divide-y divide-border/60">
                {mintEvents.map((e) => (
                  <NftEventRow key={`${e.nftId}-${e.blockHeight}-mint`} event={e} />
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-fg-faint">No recent mints.</p>
            )}
          </CardBody>
        </Card>
      </div>
      <p className="text-xs text-fg-faint">
        Have an NFT id or a launcher id? Search it above, or open <span className="mono">/nft/&lt;id&gt;</span> directly.
      </p>
    </div>
  );
}
