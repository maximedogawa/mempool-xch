"use client";

import { ExternalLink } from "lucide-react";
import { formatAge } from "@/shared/lib/format/time";
import { dexieOfferUrl } from "@/shared/lib/nft/mintgarden";
import { Card, CardBody, CardHeader, CopyButton, Skeleton } from "@/shared/ui";
import { useT } from "@/shared/i18n/useT";
import { formatXchDecimal } from "./format";
import { useNftOffers } from "./useNftSection";

/**
 * Open sell offers from Dexie, cheapest first. The Sage app bridge has no
 * offer-accept capability (checked against sage-app-sdk's UserBridgeCapability union, 2026-09-17:
 * only send_xch / sign_coin_spends / send_transaction and no take-offer method), so this links out
 * to Dexie or hands over the offer file to paste into a wallet instead of a one-click accept.
 */
export function NftOffersCard({ nftId, enabled }: { nftId: string; enabled: boolean }) {
  const t = useT("nft");
  const offers = useNftOffers(nftId, enabled);
  if (!enabled) return null;

  return (
    <Card>
      <CardHeader
        title={
          offers.data && offers.data.length > 0
            ? t("offers.titleCount", { count: offers.data.length })
            : t("offers.title")
        }
      />
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
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="font-medium">
                  {o.priceXch !== null
                    ? formatXchDecimal(o.priceXch)
                    : o.requested.map((r) => `${r.amount} ${r.code}`).join(" + ")}
                  {o.dateFound ? (
                    <span className="ml-2 text-xs font-normal text-fg-faint">
                      {t("offers.found", { age: formatAge(o.dateFound) })}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <CopyButton value={o.offerFile} label={t("offers.copyOfferFile")} />
                  <a
                    href={dexieOfferUrl(o.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    {t("offers.viewOnDexie")} <ExternalLink size={11} aria-hidden="true" />
                  </a>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-center text-sm text-fg-faint">{t("offers.none")}</p>
        )}
        <p className="text-xs text-fg-faint">{t("offers.howToAccept")}</p>
      </CardBody>
    </Card>
  );
}
