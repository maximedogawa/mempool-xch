"use client";

import { ArrowDownLeft, ArrowRight, Clock3, Coins, Eye, Image as ImageIcon, X } from "lucide-react";
import type { ReactNode } from "react";
import type { TxSummary } from "@/shared/lib/rpc/types";
import { formatAmount, formatCat } from "@/shared/lib/chia/amounts";
import { deriveAddressFlow } from "@/widgets/address/deriveFlow";
import { CatRef } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { formatEta } from "@/shared/lib/format/time";
import type { PendingStatus } from "@/shared/lib/wallet/pendingTracker";
import { useT } from "@/shared/i18n/useT";
import watchlistNs from "@/shared/i18n/messages/en/watchlist";

export function WatchStatus({
  children,
  pending = false,
}: {
  children: ReactNode;
  pending?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        pending
          ? "border-warning/30 bg-warning/10 text-warning"
          : "border-border bg-surface-2 text-fg-muted"
      )}
    >
      {children}
    </span>
  );
}

export function RemoveWatch({ label, onRemove }: { label: string; onRemove: () => void }) {
  const t = useT(watchlistNs);
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={t("parts.stopWatching", { label })}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-faint transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-primary"
    >
      <X size={15} aria-hidden="true" />
    </button>
  );
}

export function WatchQueue({ status }: { status: PendingStatus }) {
  const t = useT(watchlistNs);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="inline-flex items-center gap-1.5 font-semibold text-warning">
        <Clock3 size={12} aria-hidden="true" />
        {status.blockIndex === 0
          ? t("parts.nextBlock")
          : status.blockIndex !== null
            ? t("parts.projectedBlock", { n: status.blockIndex + 1 })
            : status.phase === "waiting"
              ? t("parts.waiting")
              : t("parts.awaitingMempool")}
      </span>
      {status.position !== null ? (
        <span className="tabular text-fg-muted">
          {t("parts.position", { position: status.position, size: status.blockSize ?? "" })}
        </span>
      ) : null}
      {status.etaSeconds !== null ? (
        <span className="inline-flex items-center gap-1 text-fg-faint">
          <ArrowRight size={11} aria-hidden="true" />
          {formatEta(status.etaSeconds)}
        </span>
      ) : null}
    </div>
  );
}

export function WatchedBlockBadge({ count }: { count: number }) {
  const t = useT(watchlistNs);
  return (
    <span className="mt-1 inline-flex h-5 items-center gap-1 rounded-full border border-warning/60 bg-bg/90 px-2 text-[10px] font-bold text-warning shadow-sm">
      <Eye size={11} aria-hidden="true" />
      {t("parts.watchedBadge", { count })}
    </span>
  );
}

/** Net receipts avoid labelling change returned to the sender as an incoming payment. */
export function ReceivedAssets({
  tx,
  p2,
  pending = false,
}: {
  tx: TxSummary;
  p2: string;
  pending?: boolean;
}) {
  const t = useT(watchlistNs);
  const flow = deriveAddressFlow(tx, p2);
  const cats = flow.cats.filter((cat) => cat.amount > 0n);
  const nfts = flow.nftsIn.filter((id) => !flow.nftsOut.includes(id));
  if (flow.xch <= 0n && cats.length === 0 && nfts.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span
        className={cn(
          "inline-flex items-center gap-1 font-semibold",
          pending ? "text-warning" : "text-primary"
        )}
      >
        <ArrowDownLeft size={13} aria-hidden="true" />
        {pending ? t("parts.incoming") : t("parts.received")}
      </span>
      {flow.xch > 0n ? (
        <span className="tabular inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary-soft px-2 py-1 text-primary">
          <Coins size={12} aria-hidden="true" />+{formatAmount(flow.xch)}
        </span>
      ) : null}
      {cats.slice(0, 3).map((cat) => (
        <span
          key={cat.assetId}
          className="tabular inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1"
        >
          <Coins size={12} aria-hidden="true" />+{formatCat(cat.amount)}{" "}
          <CatRef assetId={cat.assetId} />
        </span>
      ))}
      {cats.length > 3 ? (
        <span className="text-fg-muted">{t("parts.moreTokens", { count: cats.length - 3 })}</span>
      ) : null}
      {nfts.length ? (
        <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface px-2 py-1 text-fg">
          <ImageIcon size={12} aria-hidden="true" />
          {t("parts.nfts", { count: nfts.length })}
        </span>
      ) : null}
    </div>
  );
}
