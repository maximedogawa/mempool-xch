"use client";

import { useState } from "react";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { mintGardenCollectionUrl } from "@/shared/lib/nft/mintgarden";
import type { CollectionInterval } from "@/shared/lib/nft/mintgarden";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Skeleton,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { AssetImage } from "@/shared/ui/AssetImage";
import { Tooltip } from "@/shared/ui/Tooltip";
import { useT } from "@/shared/i18n/useT";
import { formatXchDecimal } from "./format";
import { useCollectionsList } from "./useNftSection";

const INTERVALS: readonly { id: CollectionInterval; label: "d1" | "d7" | "d30" | "all" }[] = [
  { id: "1", label: "d1" },
  { id: "7", label: "d7" },
  { id: "30", label: "d30" },
  { id: "all", label: "all" },
];

export function NftCollectionsPage() {
  const t = useT("nft");
  const [interval, setInterval] = useState<CollectionInterval>("30");
  const [search, setSearch] = useState("");
  const query = useCollectionsList(interval, search);
  const collections = query.data?.pages.flatMap((p) => p.collections) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("collections.title")}</h1>
          <Tooltip text={t("collections.intro")} placement="bottom" />
        </div>
      </header>

      <Card>
        <CardHeader
          title={t("collections.card")}
          action={
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("collections.search")}
              aria-label={t("collections.search")}
              className="h-8 w-48 rounded-sm border border-border bg-surface px-2 text-xs text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none sm:w-64"
            />
          }
        />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-fg-muted">
              {t("collections.window")}
            </span>
            <div
              role="radiogroup"
              aria-label={t("collections.window")}
              className="flex flex-wrap gap-1"
            >
              {INTERVALS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={interval === opt.id}
                  onClick={() => setInterval(opt.id)}
                  className={cn(
                    "min-h-8 rounded-sm border px-2.5 text-xs font-semibold transition-colors",
                    interval === opt.id
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border bg-bg text-fg-muted hover:text-fg"
                  )}
                >
                  {t(`collections.intervals.${opt.label}`)}
                </button>
              ))}
            </div>
          </div>

          {query.error ? (
            <EmptyState tone="danger" title={t("collectionsError")} description={t("noAnswer")} />
          ) : query.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">
              {t("collections.noMatch", { query: search })}
            </p>
          ) : (
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={t("collections.card")}
            >
              <Table>
                <thead>
                  <tr>
                    <Th>{t("collections.colCollection")}</Th>
                    <Th className="hidden text-right md:table-cell">{t("collections.colItems")}</Th>
                    <Th className="text-right">{t("collections.colFloor")}</Th>
                    <Th className="text-right">{t("collections.colVolume")}</Th>
                    <Th className="hidden text-right sm:table-cell">
                      {t("collections.colTrades")}
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {collections.map((c) => (
                    <Tr key={c.id}>
                      <Td>
                        <a
                          href={mintGardenCollectionUrl(c.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 items-center gap-2 hover:text-accent"
                        >
                          <AssetImage
                            urls={c.thumbnailUrl ? [c.thumbnailUrl] : []}
                            alt=""
                            className="h-8 w-8 shrink-0"
                            rounded="rounded-sm"
                            sensitivity={c.sensitivity}
                            veilDetail={false}
                          />
                          <span className="truncate font-medium">{c.name ?? t("untitled")}</span>
                        </a>
                      </Td>
                      <Td className="tabular hidden text-right md:table-cell">
                        {c.nftCount !== null ? formatNumber(c.nftCount) : "—"}
                      </Td>
                      <Td className="tabular text-right">
                        {c.floorPriceXch !== null ? formatXchDecimal(c.floorPriceXch) : "—"}
                      </Td>
                      <Td className="tabular text-right">
                        {c.volumeXch !== null ? formatXchDecimal(c.volumeXch) : "—"}
                      </Td>
                      <Td className="tabular hidden text-right sm:table-cell">
                        {c.tradeCount !== null ? formatNumber(c.tradeCount) : "—"}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {query.hasNextPage ? (
            <Button
              size="sm"
              className="self-center"
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {query.isFetchingNextPage ? t("loading") : t("showMore")}
            </Button>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
