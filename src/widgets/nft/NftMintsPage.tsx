"use client";

import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { useT } from "@/shared/i18n/useT";
import { NftEventRow } from "./NftEventRow";
import { useNftEvents } from "./useNftSection";
import nftNs from "@/shared/i18n/messages/en/nft";

export function NftMintsPage() {
  const t = useT(nftNs);
  const query = useNftEvents(["mint"]);
  const events = query.data?.pages.flatMap((p) => p.events) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("mints.title")}</h1>
          <Tooltip text={t("mints.intro")} placement="bottom" />
        </div>
      </header>

      <Card>
        <CardHeader title={t("mints.card")} />
        <CardBody className="flex flex-col gap-3">
          {query.error ? (
            <EmptyState tone="danger" title={t("mintsError")} description={t("noAnswer")} />
          ) : query.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">{t("noRecentMints")}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {events.map((e) => (
                <NftEventRow key={`${e.nftId}-${e.blockHeight}-mint`} event={e} />
              ))}
            </ul>
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
