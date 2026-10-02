"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { errorMessage } from "@/shared/lib/rpc/errors";
import type { OfferList, OfferState, OfferStatus } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Button, Card, CardBody, CardHeader, Hash, Skeleton } from "@/shared/ui";
import { usePagedList } from "@/widgets/assets/usePagedList";
import { useT } from "@/shared/i18n/useT";
import { OFFER_STATUS, OfferSideView, OfferStatusBadge } from "./OfferParts";
import offersNs from "@/shared/i18n/messages/en/offers";

type TabStatus = Extract<OfferStatus, "open" | "confirmed" | "cancelled" | "expired" | "pending">;

const STATUS_TABS: TabStatus[] = ["open", "confirmed", "cancelled", "expired", "pending"];

export type OfferScope =
  | { kind: "address"; p2: string }
  | { kind: "cat"; assetId: string }
  | { kind: "nft"; nftId: string };

function scopeKey(scope: OfferScope): string {
  return scope.kind === "address" ? scope.p2 : scope.kind === "cat" ? scope.assetId : scope.nftId;
}

/**
 * Offers Coinset has indexed for an address (as maker), a CAT or an NFT, one lifecycle status
 * at a time (Coinset lists per status), newest first with "load more". Rendered nowhere on a
 * custom node: the offer index is Coinset-only.
 */
export function OffersCard({ scope, title }: { scope: OfferScope; title?: string }) {
  const t = useT(offersNs);
  const { client, endpoints, networkConfig } = useSettings();
  const [status, setStatus] = useState<TabStatus>("open");
  const id = scopeKey(scope);
  const network = endpoints.network;
  const list = usePagedList<OfferState>({
    queryKey: useCallback(
      (cursor: string | null) => [
        ...queryKeys.chainRoot(network),
        "offers",
        scope.kind,
        id,
        status,
        cursor,
      ],
      [network, scope.kind, id, status]
    ),
    fetchPage: useCallback(
      async (cursor: string | null, limit: number, signal: AbortSignal) => {
        const opts = { cursor: cursor ?? undefined, limit };
        const page: OfferList =
          scope.kind === "address"
            ? await client.getOffersByP2(scope.p2, status, opts, signal)
            : scope.kind === "cat"
              ? await client.getOffersByCatAssetId(scope.assetId, status, opts, signal)
              : await client.getOffersByNftId(scope.nftId, status, opts, signal);
        return { items: page.offers, truncated: page.truncated, nextCursor: page.nextCursor };
      },
      [client, scope, status]
    ),
    enabled: client.hasIndexed,
    refetchInterval: status === "open" || status === "pending" ? 30_000 : undefined,
    itemKey: (o) => o.offerId,
  });
  if (!client.hasIndexed) return null;

  return (
    <Card>
      <CardHeader
        title={title ?? t("card.title")}
        action={
          <div role="group" aria-label={t("card.statusGroup")} className="flex flex-wrap gap-1">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
                  status === s
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-fg-muted hover:text-fg"
                )}
              >
                {t(`status.${OFFER_STATUS[s].key}`)}
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="flex flex-col gap-3">
        {list.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : list.error ? (
          <p className="py-4 text-center text-sm text-danger">{errorMessage(list.error)}</p>
        ) : list.items.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-faint">
            {scope.kind === "address"
              ? t(`card.emptyAddress.${status}`)
              : t(`card.emptyAsset.${status}`)}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border/60 text-sm" data-testid="offers-list">
            {list.items.map((o) => {
              const maker = o.makerP2s[0]
                ? puzzleHashToAddress(o.makerP2s[0], networkConfig.addressPrefix)
                : null;
              const when = o.confirmedAtMs ?? o.cancelledAtMs ?? o.firstSeenMs;
              return (
                <li
                  key={o.offerId}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2"
                >
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <OfferStatusBadge status={o.status} />
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {t.rich("card.trade", {
                        muted: (c) => <span className="text-fg-faint">{c}</span>,
                        offered: () => <OfferSideView side={o.offered} />,
                        arrow: () => (
                          <ArrowRight size={13} aria-hidden="true" className="text-fg-faint" />
                        ),
                        requested: () => <OfferSideView side={o.requested} />,
                      })}
                    </span>
                  </div>
                  <span className="flex flex-wrap items-center gap-x-3 text-xs text-fg-faint">
                    {maker && scope.kind !== "address" ? (
                      <span>
                        {t.rich("card.by", {
                          maker: () => (
                            <Hash value={maker} href={routes.address(maker)} head={7} tail={4} />
                          ),
                        })}
                      </span>
                    ) : null}
                    <span>{formatAge(when)}</span>
                    <Link href={routes.offer(o.offerId)} className="text-accent hover:underline">
                      {t("card.details")}
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {list.hasMore ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void list.loadMore()}
            disabled={list.loadingMore}
            className="self-center"
          >
            {list.loadingMore ? t("card.loading") : t("card.loadMore")}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
