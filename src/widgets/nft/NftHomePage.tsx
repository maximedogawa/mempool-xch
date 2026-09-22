"use client";

import Link from "next/link";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { mintGardenCollectionUrl } from "@/shared/lib/nft/mintgarden";
import { routes } from "@/shared/lib/routes";
import { Card, CardBody, CardHeader, EmptyState, Skeleton, StatTile } from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { Tooltip } from "@/shared/ui/Tooltip";
import { useT } from "@/shared/i18n/useT";
import { formatXchDecimal } from "./format";
import { NftEventRow } from "./NftEventRow";
import { useNftEvents, useTopCollections } from "./useNftSection";

export function NftHomePage() {
  const t = useT("nft");
  const collections = useTopCollections("30", 6);
  const activity = useNftEvents(undefined, 8);
  const mints = useNftEvents(["mint"], 6);

  const totalVolume30d =
    collections.data?.collections.reduce((sum, c) => sum + (c.volumeXch ?? 0), 0) ?? 0;
  const totalTrades30d =
    collections.data?.collections.reduce((sum, c) => sum + (c.tradeCount ?? 0), 0) ?? 0;
  const activityEvents = activity.data?.pages.flatMap((p) => p.events) ?? [];
  const mintEvents = mints.data?.pages.flatMap((p) => p.events) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header
        className="flex flex-col gap-2 rounded-card border border-border bg-bg-elevated px-5 py-5 sm:px-7 sm:py-6"
        style={{
          backgroundImage:
            "radial-gradient(900px 260px at 20% -10%, rgba(214,140,245,0.14), transparent 70%), radial-gradient(700px 240px at 90% 10%, rgba(94,206,123,0.12), transparent 70%)",
        }}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight">
            NFT<span className="text-kind-nft">s</span>
          </h1>
          <Tooltip text={t("home.intro")} placement="bottom" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t("home.topVolume")}
          value={
            collections.data ? formatXchDecimal(totalVolume30d) : <Skeleton className="h-6 w-20" />
          }
          hint={t("home.topVolumeHint")}
        />
        <StatTile
          label={t("home.topTrades")}
          value={
            collections.data ? formatNumber(totalTrades30d) : <Skeleton className="h-6 w-16" />
          }
        />
        <StatTile
          label={t("home.recentActivity")}
          value={
            activity.data ? formatNumber(activityEvents.length) : <Skeleton className="h-6 w-12" />
          }
          sub={t("home.eventsShown")}
        />
        <StatTile
          label={t("home.recentMints")}
          value={mints.data ? formatNumber(mintEvents.length) : <Skeleton className="h-6 w-12" />}
          sub={t("home.mintsShown")}
        />
      </div>

      <Card>
        <CardHeader
          title={t("home.spotlight")}
          action={
            <Link href={routes.nftCollections()} className="text-xs text-accent hover:underline">
              {t("home.allCollections")}
            </Link>
          }
        />
        <CardBody>
          {collections.error ? (
            <EmptyState tone="danger" title={t("collectionsError")} description={t("noAnswer")} />
          ) : collections.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          ) : collections.data && collections.data.collections.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {collections.data.collections.map((c) => (
                <a
                  key={c.id}
                  href={mintGardenCollectionUrl(c.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative isolate flex aspect-square flex-col justify-end overflow-hidden rounded-xl shadow-card ring-1 ring-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/50"
                >
                  <AssetImage
                    urls={c.thumbnailUrl ? [c.thumbnailUrl] : []}
                    alt={c.name ?? t("home.collectionAlt")}
                    rounded=""
                    sensitivity={c.sensitivity}
                    veilDetail={false}
                    className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-110"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent"
                  />
                  <div className="relative z-10 flex flex-col gap-0.5 p-2.5">
                    <span className="truncate text-sm font-semibold text-white">
                      {c.name ?? t("untitled")}
                    </span>
                    <span className="tabular text-[11px] font-medium text-white/75">
                      {c.floorPriceXch !== null
                        ? t("home.floor", { price: formatXchDecimal(c.floorPriceXch) })
                        : t("home.noFloor")}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-fg-faint">{t("home.noCollections")}</p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t("home.recentActivity")}
            action={
              <Link href={routes.nftActivity()} className="text-xs text-accent hover:underline">
                {t("home.allActivity")}
              </Link>
            }
          />
          <CardBody>
            {activity.error ? (
              <EmptyState tone="danger" title={t("activityError")} description={t("noAnswer")} />
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
              <p className="py-4 text-center text-sm text-fg-faint">{t("home.noActivity")}</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title={t("home.newMints")}
            action={
              <Link href={routes.nftMints()} className="text-xs text-accent hover:underline">
                {t("home.allMints")}
              </Link>
            }
          />
          <CardBody>
            {mints.error ? (
              <EmptyState tone="danger" title={t("mintsError")} description={t("noAnswer")} />
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
              <p className="py-4 text-center text-sm text-fg-faint">{t("noRecentMints")}</p>
            )}
          </CardBody>
        </Card>
      </div>
      <p className="text-xs text-fg-faint">
        {t.rich("home.searchHint", {
          path: "/nft/<id>",
          mono: (c) => <span className="mono">{c}</span>,
        })}
      </p>
    </div>
  );
}
