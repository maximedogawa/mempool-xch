"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useDetailId } from "@/shared/hooks/useDetailId";
import { queryKeys } from "@/shared/api/queryKeys";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { normaliseId32 } from "@/shared/lib/chia/hex";
import { formatAge, formatDateTime } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { errorMessage, isNotFound } from "@/shared/lib/rpc/errors";
import { useSettings } from "@/shared/providers/SettingsProvider";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Hash,
  Skeleton,
  StatTile,
} from "@/shared/ui";
import { useT } from "@/shared/i18n/useT";
import { OFFER_STATUS, OfferSideView, OfferStatusBadge } from "./OfferParts";
import offersNs from "@/shared/i18n/messages/en/offers";

const DEXIE_OFFER_LOOKUP = "https://dexie.space/offers";

/**
 * One offer as Coinset indexes it: lifecycle state, both sides, maker addresses and the
 * transactions that took or cancelled it. The offer file itself is not available here (Coinset
 * does not return it), so taking the offer happens on Dexie or in a wallet.
 */
export function OfferPage() {
  const t = useT(offersNs);
  const raw = useDetailId("offer") ?? "";
  const offerId = normaliseId32(raw);
  const { client, endpoints, networkConfig } = useSettings();
  const query = useQuery({
    queryKey: [...queryKeys.chainRoot(endpoints.network), "offer", offerId ?? ""],
    queryFn: ({ signal }) => client.getOffer(offerId!, signal),
    enabled: offerId !== null && client.hasIndexed,
    refetchInterval: (q) =>
      q.state.data &&
      (q.state.data.status === "open" ||
        q.state.data.status === "pending" ||
        q.state.data.status === "cancel_pending")
        ? 15_000
        : false,
    retry: (count, error) => !isNotFound(error) && count < 2,
  });

  if (!offerId) {
    return (
      <EmptyState
        tone="danger"
        title={t("page.invalidTitle")}
        description={t("page.invalidDescription", { raw: raw || t("page.empty") })}
      />
    );
  }
  if (!client.hasIndexed) {
    return (
      <EmptyState
        title={t("page.needsCoinsetTitle")}
        description={t.rich("page.needsCoinsetDescription", {
          link: (c) => (
            <Link href={routes.settings()} className="text-accent hover:underline">
              {c}
            </Link>
          ),
        })}
      />
    );
  }
  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }
  if (query.error && isNotFound(query.error)) {
    return (
      <div className="flex flex-col gap-4">
        <Heading id={offerId} />
        <EmptyState
          title={t("page.notIndexedTitle")}
          description={t("page.notIndexedDescription")}
        />
      </div>
    );
  }
  if (query.error || !query.data) {
    return (
      <EmptyState
        tone="danger"
        title={t("page.loadError")}
        description={errorMessage(query.error)}
        action={<Button onClick={() => void query.refetch()}>{t("page.retry")}</Button>}
      />
    );
  }
  const offer = query.data;
  const status = OFFER_STATUS[offer.status];
  const settledTx = offer.confirmedTxId ?? offer.cancelledByTxId ?? offer.pendingTxId;
  const settledAt = offer.confirmedAtMs ?? offer.cancelledAtMs;
  const addr = (p2: string) => puzzleHashToAddress(p2, networkConfig.addressPrefix);
  const settledKey = offer.confirmedTxId
    ? "takenIn"
    : offer.cancelledByTxId
      ? "cancelledBy"
      : "beingTaken";
  // A settling transaction lands in one block: the take's or the cancel's.
  const settledHeight = offer.confirmedHeight ?? offer.cancelledHeight;

  return (
    <div className="flex flex-col gap-4">
      <Heading id={offerId} status={offer.status} />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile
          label={t("page.status")}
          value={t(`status.${status.key}`)}
          sub={
            offer.status === "open"
              ? t("page.canBeTaken")
              : offer.status === "pending"
                ? t("page.takeInMempool")
                : offer.status === "cancel_pending"
                  ? t("page.cancelInMempool")
                  : undefined
          }
          tone={
            offer.status === "open"
              ? "primary"
              : offer.status === "cancelled"
                ? "danger"
                : "default"
          }
        />
        <StatTile
          label={t("page.firstSeen")}
          value={formatAge(offer.firstSeenMs)}
          sub={formatDateTime(offer.firstSeenMs)}
        />
        <StatTile
          label={
            offer.status === "cancelled"
              ? t("page.cancelled")
              : offer.status === "confirmed"
                ? t("page.taken")
                : t("page.expires")
          }
          value={
            settledAt
              ? formatAge(settledAt)
              : offer.expiresBeforeHeight !== null
                ? t("page.beforeHeight", { height: formatNumber(offer.expiresBeforeHeight) })
                : offer.expiresBeforeTimeMs !== null
                  ? formatAge(offer.expiresBeforeTimeMs)
                  : "—"
          }
          sub={
            settledAt
              ? formatDateTime(settledAt)
              : offer.expiresBeforeHeight !== null || offer.expiresBeforeTimeMs !== null
                ? t("page.setByMaker")
                : t("page.noExpiry")
          }
        />
        <StatTile
          label={t("page.fee")}
          value={formatAmount(offer.feeMojos)}
          sub={t("page.offeredByMaker")}
        />
      </div>

      <Card>
        <CardHeader title={t("page.trade")} />
        <CardBody>
          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-sm border border-border bg-bg p-3">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                {t("page.makerOffers")}
              </div>
              <OfferSideView side={offer.offered} className="text-base font-medium" />
            </div>
            <ArrowRight aria-hidden="true" className="mx-auto hidden text-fg-faint md:block" />
            <div className="rounded-sm border border-border bg-bg p-3">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                {t("page.makerRequests")}
              </div>
              <OfferSideView side={offer.requested} className="text-base font-medium" />
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("page.makerAddresses", { count: offer.makerP2s.length })} />
          <CardBody>
            {offer.makerP2s.length === 0 ? (
              <p className="text-sm text-fg-faint">{t("page.unknown")}</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {offer.makerP2s.map((p2) => (
                  <li key={p2}>
                    <Hash
                      value={addr(p2)}
                      href={routes.address(addr(p2))}
                      head={12}
                      tail={6}
                      copy
                    />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("page.settlement")} />
          <CardBody className="flex flex-col gap-2 text-sm">
            {settledTx ? (
              <p>
                {t.rich(`page.${settledKey}${settledHeight !== null ? "Block" : ""}` as const, {
                  height: settledHeight !== null ? formatNumber(settledHeight) : "",
                  tx: () => (
                    <Hash value={settledTx} href={routes.tx(settledTx)} head={10} tail={6} />
                  ),
                  block: (c) =>
                    settledHeight !== null ? (
                      <Link
                        href={routes.block(settledHeight)}
                        className="text-accent hover:underline"
                      >
                        {c}
                      </Link>
                    ) : (
                      c
                    ),
                })}
              </p>
            ) : (
              <p className="text-fg-faint">{t("page.notSettled")}</p>
            )}
            <p className="text-xs text-fg-faint">
              {t.rich("page.noOfferFile", {
                link: (c) => (
                  <a
                    href={DEXIE_OFFER_LOOKUP}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    {c} <ExternalLink size={11} aria-hidden="true" />
                  </a>
                ),
              })}
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Heading({
  id,
  status,
}: {
  id: string;
  status?: Parameters<typeof OfferStatusBadge>[0]["status"];
}) {
  const t = useT(offersNs);
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">{t("page.heading")}</h1>
        {status ? <OfferStatusBadge status={status} /> : null}
      </div>
      <Hash value={id} full copy className="text-sm text-fg-muted" />
    </header>
  );
}
