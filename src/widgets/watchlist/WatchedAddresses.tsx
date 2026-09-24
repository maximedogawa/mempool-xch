"use client";

import { Eye } from "lucide-react";
import { useProjectedBlocks } from "@/shared/api/hooks";
import { shortId } from "@/shared/lib/chia/hex";
import type { WatchItem } from "@/shared/lib/watchlist/store";
import { useT } from "@/shared/i18n/useT";
import { Card, CardBody, CardHeader } from "@/shared/ui";
import { WatchedAddressRow } from "./WatchedAddressRow";
import { useWatchlist } from "./useWatchlist";
import { useWatchNotify } from "./useWatchNotify";
import portfolioNs from "@/shared/i18n/messages/en/portfolio";
import watchlistNs from "@/shared/i18n/messages/en/watchlist";

/**
 * The watchlist's address cards on their own, as the dashboard shows them: pending status,
 * received assets, the latest confirmation and a remove button. The portfolio page lists them
 * under the holdings so the addresses behind the numbers are visible.
 */
export function WatchedAddresses({ addresses }: { addresses: WatchItem[] }) {
  const t = useT(watchlistNs);
  const tp = useT(portfolioNs);
  const { remove } = useWatchlist();
  const projected = useProjectedBlocks(8);
  const notify = useWatchNotify();
  if (addresses.length === 0) return null;
  return (
    <Card role="region" aria-label={tp("watched", { count: addresses.length })}>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <Eye size={17} className="text-primary" aria-hidden="true" />
            {tp("watched", { count: addresses.length })}
          </span>
        }
      />
      <CardBody>
        <ul className="grid grid-cols-1 items-start gap-3 lg:grid-cols-2">
          {addresses.map((item) => (
            <WatchedAddressRow
              key={`address:${item.id}`}
              item={item}
              projectedItems={projected.summary?.items}
              projectedBlocks={projected.blocks}
              onConfirmed={(it, txId) =>
                notify(t("panel.notifyConfirmed", { label: it.label }), shortId(txId))
              }
              onReceived={(it, txId) =>
                notify(t("panel.notifyIncoming", { label: it.label }), shortId(txId))
              }
              onRemove={() => remove("address", item.id)}
            />
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
