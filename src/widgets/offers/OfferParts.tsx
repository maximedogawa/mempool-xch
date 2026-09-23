"use client";

import Link from "next/link";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import { formatAmount, formatCat } from "@/shared/lib/chia/amounts";
import { routes } from "@/shared/lib/routes";
import type { OfferSide, OfferStatus } from "@/shared/lib/rpc/types";
import { Badge, CatRef, Hash } from "@/shared/ui";
import { useT } from "@/shared/i18n/useT";

export const OFFER_STATUS: Record<
  OfferStatus,
  {
    key: "open" | "pending" | "confirmed" | "cancelPending" | "cancelled" | "expired";
    tone: "primary" | "info" | "warning" | "danger" | "neutral";
  }
> = {
  open: { key: "open", tone: "primary" },
  pending: { key: "pending", tone: "info" },
  confirmed: { key: "confirmed", tone: "neutral" },
  cancel_pending: { key: "cancelPending", tone: "warning" },
  cancelled: { key: "cancelled", tone: "danger" },
  expired: { key: "expired", tone: "warning" },
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const t = useT("offers");
  const s = OFFER_STATUS[status];
  return <Badge tone={s.tone}>{t(`status.${s.key}`)}</Badge>;
}

/** One side of an offer as "0.5 XCH + 12 SBX + NFT nft1…"; an empty side reads as "nothing". */
export function OfferSideView({ side, className }: { side: OfferSide; className?: string }) {
  const t = useT("offers");
  const parts: React.ReactNode[] = [];
  if (side.xch > 0n) parts.push(<span key="xch">{formatAmount(side.xch)}</span>);
  side.cats.forEach((c) =>
    parts.push(
      <CatRef
        key={c.assetId}
        assetId={c.assetId}
        amountText={c.amount > 0n ? formatCat(c.amount) : undefined}
      />
    )
  );
  side.nfts.forEach((n) => {
    const nftId = launcherIdToNftId(n);
    parts.push(
      <Link
        key={n}
        href={routes.nft(nftId)}
        className="inline-flex items-center gap-1 hover:underline"
      >
        <Badge tone="nft">NFT</Badge>
        <Hash value={nftId} head={8} tail={4} />
      </Link>
    );
  });
  if (parts.length === 0)
    return <span className={className ?? "text-fg-faint"}>{t("nothing")}</span>;
  return (
    <span
      className={["inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5", className]
        .filter(Boolean)
        .join(" ")}
    >
      {parts.map((p, i) =>
        i > 0
          ? [
              <span key={`plus-${i}`} className="text-fg-faint">
                +
              </span>,
              p,
            ]
          : p
      )}
    </span>
  );
}
