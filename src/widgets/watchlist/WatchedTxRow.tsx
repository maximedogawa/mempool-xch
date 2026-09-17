"use client";

import { CheckCircle2, X, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { describePending, pendingLine } from "@/shared/lib/wallet/pendingTracker";
import type { WatchItem } from "@/shared/lib/watchlist/store";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { routes } from "@/shared/lib/routes";
import { Hash } from "@/shared/ui";
import { useTransaction } from "@/widgets/tx/useTransaction";

export function WatchedTxRow({
  item,
  projectedItems,
  projectedBlocks,
  onConfirmed,
  onRemove,
}: {
  item: WatchItem;
  projectedItems: CompactMempoolItem[] | undefined;
  projectedBlocks: ProjectedBlock[];
  onConfirmed: (item: WatchItem, height: number | null) => void;
  onRemove: () => void;
}) {
  const tx = useTransaction(item.id);
  const prevStatus = useRef<string | null>(null);

  useEffect(() => {
    const status = tx.data?.status;
    if (!status) return;
    if (prevStatus.current === "pending" && status === "confirmed" && tx.data?.status === "confirmed") {
      onConfirmed(item, tx.data.summary.confirmedHeight);
    }
    prevStatus.current = status;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.data?.status]);

  const view = tx.data;
  const status = view?.status;

  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <Hash value={item.id} href={routes.tx(item.id)} head={8} tail={6} className="font-medium" />
        {status === "pending" ? (
          <span className="text-xs text-fg-muted">{pendingLine(describePending(item.id, projectedItems, projectedBlocks))}</span>
        ) : status === "confirmed" && view?.status === "confirmed" ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 size={12} aria-hidden="true" />
            Confirmed
            {view.summary.confirmedHeight ? (
              <>
                {" "}
                in block{" "}
                <Link href={routes.block(view.summary.confirmedHeight)} className="font-semibold hover:underline">
                  {formatNumber(view.summary.confirmedHeight)}
                </Link>
              </>
            ) : null}
          </span>
        ) : status === "removed" ? (
          <span className="inline-flex items-center gap-1 text-xs text-fg-faint">
            <XCircle size={12} aria-hidden="true" />
            Dropped from the mempool without confirming
          </span>
        ) : status === "not_found" ? (
          <span className="text-xs text-fg-faint">Not found yet</span>
        ) : (
          <span className="text-xs text-fg-faint">Loading…</span>
        )}
      </div>
      <button type="button" onClick={onRemove} aria-label={`Stop watching ${item.label}`} className="rounded-sm p-1 text-fg-faint hover:text-fg">
        <X size={14} aria-hidden="true" />
      </button>
    </li>
  );
}
