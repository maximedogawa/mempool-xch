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
import { Button, Card, CardBody, CardHeader, EmptyState, Hash, Skeleton, StatTile } from "@/shared/ui";
import { OFFER_STATUS_LABEL, OfferSideView, OfferStatusBadge } from "./OfferParts";

const DEXIE_OFFER_LOOKUP = "https://dexie.space/offers";

/**
 * One offer as Coinset indexes it: lifecycle state, both sides, maker addresses and the
 * transactions that took or cancelled it. The offer file itself is not available here (Coinset
 * does not return it), so taking the offer happens on Dexie or in a wallet.
 */
export function OfferPage() {
  const raw = useDetailId("offer") ?? "";
  const offerId = normaliseId32(raw);
  const { client, endpoints, networkConfig } = useSettings();
  const query = useQuery({
    queryKey: [...queryKeys.chainRoot(endpoints.network), "offer", offerId ?? ""],
    queryFn: ({ signal }) => client.getOffer(offerId!, signal),
    enabled: offerId !== null && client.hasIndexed,
    refetchInterval: (q) => (q.state.data && (q.state.data.status === "open" || q.state.data.status === "pending" || q.state.data.status === "cancel_pending") ? 15_000 : false),
    retry: (count, error) => !isNotFound(error) && count < 2,
  });

  if (!offerId) {
    return <EmptyState tone="danger" title="Not a valid offer id" description={`Expected a 32-byte hex offer id. Got: ${raw || "(empty)"}`} />;
  }
  if (!client.hasIndexed) {
    return (
      <EmptyState
        title="Offers need Coinset"
        description={
          <>
            The offer index is part of Coinset&apos;s indexed API, which a custom node does not have. Switch the endpoint back to Coinset in{" "}
            <Link href={routes.settings()} className="text-accent hover:underline">
              settings
            </Link>{" "}
            to look offers up.
          </>
        }
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
          title="Offer not indexed"
          description="Coinset has not seen an offer with this id. Offers are indexed once they are published (for example on Dexie) or once a spend that takes or cancels them reaches the mempool; an offer file that was never shared cannot be looked up by id."
        />
      </div>
    );
  }
  if (query.error || !query.data) {
    return <EmptyState tone="danger" title="Could not load the offer" description={errorMessage(query.error)} action={<Button onClick={() => void query.refetch()}>Retry</Button>} />;
  }
  const offer = query.data;
  const status = OFFER_STATUS_LABEL[offer.status];
  const settledTx = offer.confirmedTxId ?? offer.cancelledByTxId ?? offer.pendingTxId;
  const settledAt = offer.confirmedAtMs ?? offer.cancelledAtMs;
  const addr = (p2: string) => puzzleHashToAddress(p2, networkConfig.addressPrefix);

  return (
    <div className="flex flex-col gap-4">
      <Heading id={offerId} status={offer.status} />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile label="Status" value={status.label} sub={offer.status === "open" ? "can still be taken" : offer.status === "pending" ? "take is in the mempool" : offer.status === "cancel_pending" ? "cancel is in the mempool" : undefined} tone={offer.status === "open" ? "primary" : offer.status === "cancelled" ? "danger" : "default"} />
        <StatTile label="First seen" value={formatAge(offer.firstSeenMs)} sub={formatDateTime(offer.firstSeenMs)} />
        <StatTile
          label={offer.status === "cancelled" ? "Cancelled" : offer.status === "confirmed" ? "Taken" : "Expires"}
          value={
            settledAt ? (
              formatAge(settledAt)
            ) : offer.expiresBeforeHeight !== null ? (
              `before #${formatNumber(offer.expiresBeforeHeight)}`
            ) : offer.expiresBeforeTimeMs !== null ? (
              formatAge(offer.expiresBeforeTimeMs)
            ) : (
              "—"
            )
          }
          sub={settledAt ? formatDateTime(settledAt) : offer.expiresBeforeHeight !== null || offer.expiresBeforeTimeMs !== null ? "as set by the maker" : "no expiry set"}
        />
        <StatTile label="Fee" value={formatAmount(offer.feeMojos)} sub="offered by the maker" />
      </div>

      <Card>
        <CardHeader title="Trade" />
        <CardBody>
          <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
            <div className="rounded-sm border border-border bg-bg p-3">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-fg-muted">Maker offers</div>
              <OfferSideView side={offer.offered} className="text-base font-medium" />
            </div>
            <ArrowRight aria-hidden="true" className="mx-auto hidden text-fg-faint md:block" />
            <div className="rounded-sm border border-border bg-bg p-3">
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-fg-muted">Maker requests</div>
              <OfferSideView side={offer.requested} className="text-base font-medium" />
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={`Maker address${offer.makerP2s.length === 1 ? "" : "es"}`} />
          <CardBody>
            {offer.makerP2s.length === 0 ? (
              <p className="text-sm text-fg-faint">Unknown.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {offer.makerP2s.map((p2) => (
                  <li key={p2}>
                    <Hash value={addr(p2)} href={routes.address(addr(p2))} head={12} tail={6} copy />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Settlement" />
          <CardBody className="flex flex-col gap-2 text-sm">
            {settledTx ? (
              <p>
                {offer.confirmedTxId ? "Taken in" : offer.cancelledByTxId ? "Cancelled by" : "Being taken by"} transaction <Hash value={settledTx} href={routes.tx(settledTx)} head={10} tail={6} />
                {offer.confirmedHeight !== null ? (
                  <>
                    {" "}
                    in block{" "}
                    <Link href={routes.block(offer.confirmedHeight)} className="text-accent hover:underline">
                      #{formatNumber(offer.confirmedHeight)}
                    </Link>
                  </>
                ) : null}
                {offer.cancelledHeight !== null ? (
                  <>
                    {" "}
                    in block{" "}
                    <Link href={routes.block(offer.cancelledHeight)} className="text-accent hover:underline">
                      #{formatNumber(offer.cancelledHeight)}
                    </Link>
                  </>
                ) : null}
                .
              </p>
            ) : (
              <p className="text-fg-faint">Nothing has taken or cancelled this offer on chain yet.</p>
            )}
            <p className="text-xs text-fg-faint">
              Coinset indexes the offer&apos;s state but not the offer file, so this page cannot hand it to a wallet. Look it up on{" "}
              <a href={DEXIE_OFFER_LOOKUP} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent hover:underline">
                Dexie <ExternalLink size={11} aria-hidden="true" />
              </a>{" "}
              to take it.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Heading({ id, status }: { id: string; status?: Parameters<typeof OfferStatusBadge>[0]["status"] }) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold">Offer</h1>
        {status ? <OfferStatusBadge status={status} /> : null}
      </div>
      <Hash value={id} full copy className="text-sm text-fg-muted" />
    </header>
  );
}
