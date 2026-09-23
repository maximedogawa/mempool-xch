"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import type { NftEventKind } from "@/shared/lib/nft/mintgarden";
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { useT } from "@/shared/i18n/useT";
import { NftEventRow } from "./NftEventRow";
import { useNftEvents } from "./useNftSection";
import nftNs from "@/shared/i18n/messages/en/nft";

const KINDS: readonly (NftEventKind | "all")[] = ["all", "mint", "transfer", "trade", "burn"];

export function NftActivityPage() {
  const t = useT(nftNs);
  const [kind, setKind] = useState<NftEventKind | "all">("all");
  const query = useNftEvents(kind === "all" ? undefined : [kind]);
  const events = query.data?.pages.flatMap((p) => p.events) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("activity.title")}</h1>
          <Tooltip text={t("activity.intro")} placement="bottom" />
        </div>
      </header>

      <Card>
        <CardHeader title={t("activity.card")} />
        <CardBody className="flex flex-col gap-3">
          <div role="radiogroup" aria-label={t("activity.kind")} className="flex flex-wrap gap-1">
            {KINDS.map((opt) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={kind === opt}
                onClick={() => setKind(opt)}
                className={cn(
                  "min-h-8 rounded-sm border px-2.5 text-xs font-semibold transition-colors",
                  kind === opt
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-bg text-fg-muted hover:text-fg"
                )}
              >
                {t(`activity.kinds.${opt}`)}
              </button>
            ))}
          </div>

          {query.error ? (
            <EmptyState tone="danger" title={t("activityError")} description={t("noAnswer")} />
          ) : query.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">{t("activity.noEvents")}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {events.map((e) => (
                <NftEventRow key={`${e.nftId}-${e.blockHeight}-${e.kind}`} event={e} />
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
