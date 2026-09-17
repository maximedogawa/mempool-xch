"use client";

import { ExternalLink } from "lucide-react";
import { formatAge } from "@/shared/lib/format/time";
import { dexieOfferUrl } from "@/shared/lib/nft/mintgarden";
import { Card, CardBody, CardHeader, CopyButton, Skeleton } from "@/shared/ui";
import { formatXchDecimal } from "./format";
import { useNftOffers } from "./useNftSection";

/**
 * Open sell offers from Dexie, cheapest first. The Sage app bridge has no
 * offer-accept capability (checked against sage-app-sdk's UserBridgeCapability union, 2026-09-17:
 * only send_xch / sign_coin_spends / send_transaction and no take-offer method), so this links out
 * to Dexie or hands over the offer file to paste into a wallet instead of a one-click accept.
 */
export function NftOffersCard({ nftId, enabled }: { nftId: string; enabled: boolean }) {
  const offers = useNftOffers(nftId, enabled);
  if (!enabled) return null;

  return (
    <Card>
      <CardHeader title={offers.data && offers.data.length > 0 ? `Open offers (${offers.data.length})` : "Open offers"} />
      <CardBody className="flex flex-col gap-3">
        {offers.isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : offers.data && offers.data.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border/60">
            {offers.data.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-medium">
                  {o.priceXch !== null ? formatXchDecimal(o.priceXch) : o.requested.map((r) => `${r.amount} ${r.code}`).join(" + ")}
                  {o.dateFound ? <span className="ml-2 text-xs font-normal text-fg-faint">found {formatAge(o.dateFound)}</span> : null}
                </span>
                <span className="flex items-center gap-2">
                  <CopyButton value={o.offerFile} label="Copy offer file" />
                  <a href={dexieOfferUrl(o.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-accent hover:underline">
                    View on Dexie <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-center text-sm text-fg-faint">No open offers on Dexie right now.</p>
        )}
        <p className="text-xs text-fg-faint">
          To accept one, paste the offer file into Sage or another Chia wallet, or take it directly on Dexie — this app cannot submit the trade for you;
          Sage&apos;s app bridge does not yet expose a way to accept an offer.
        </p>
      </CardBody>
    </Card>
  );
}
