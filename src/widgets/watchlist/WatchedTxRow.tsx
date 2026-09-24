"use client";

import { CheckCircle2, FileText, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { describePending } from "@/shared/lib/wallet/pendingTracker";
import type { WatchItem } from "@/shared/lib/watchlist/store";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { routes } from "@/shared/lib/routes";
import { Hash } from "@/shared/ui";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { useTransaction } from "@/widgets/tx/useTransaction";
import { useT } from "@/shared/i18n/useT";
import { RemoveWatch, WatchQueue, WatchStatus } from "./WatchlistParts";
import watchlistNs from "@/shared/i18n/messages/en/watchlist";

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
  const t = useT(watchlistNs);
  const tx = useTransaction(item.id);
  const { client } = useSettings();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    previous.current = null;
  }, [client]);
  useEffect(() => {
    if (tx.isError || !tx.data) return;
    if (previous.current === "pending" && tx.data.status === "confirmed")
      onConfirmed(item, tx.data.summary.confirmedHeight);
    previous.current = tx.data.status;
  }, [tx.data, tx.isError, item, onConfirmed]);
  const view = tx.data;
  const status = view?.status;
  return (
    <li className="min-w-0 rounded-xl border border-border bg-bg/50 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-2 text-fg-muted">
          <FileText size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
              {t("tx.kind")}
            </span>
            <WatchStatus pending={status === "pending" && !tx.isError}>
              {tx.isError
                ? t("common.connectionIssue")
                : status === "pending"
                  ? t("tx.pending")
                  : status === "confirmed"
                    ? t("tx.confirmed")
                    : status === "removed"
                      ? t("tx.dropped")
                      : status === "not_found"
                        ? t("tx.notFoundYet")
                        : t("common.checking")}
            </WatchStatus>
          </div>
          <Hash
            value={item.id}
            href={routes.tx(item.id)}
            head={8}
            tail={6}
            copy
            className="text-sm font-semibold"
          />
        </div>
        <RemoveWatch label={item.label} onRemove={onRemove} />
      </div>
      <div className="mt-3 border-t border-border/60 pt-3">
        {tx.isError ? (
          <p role="status" className="text-xs text-danger">
            {t("tx.refreshError")}{" "}
            <button className="underline" onClick={() => void tx.refetch()}>
              {t("common.retry")}
            </button>
          </p>
        ) : status === "pending" ? (
          <WatchQueue status={describePending(item.id, projectedItems, projectedBlocks)} />
        ) : view?.status === "confirmed" ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-primary">
            <CheckCircle2 size={13} aria-hidden="true" />
            {t("tx.included")}
            {view.summary.confirmedHeight !== null ? (
              <Link
                href={routes.block(view.summary.confirmedHeight)}
                className="tabular ml-1 font-semibold hover:underline"
              >
                {t("common.block", { height: formatNumber(view.summary.confirmedHeight) })}
              </Link>
            ) : null}
          </span>
        ) : status === "removed" ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-fg-faint">
            <XCircle size={13} aria-hidden="true" />
            {t("tx.droppedLong")}
          </span>
        ) : (
          <span className="text-xs text-fg-faint">
            {status === "not_found" ? t("tx.noRecord") : t("tx.checkingStatus")}
          </span>
        )}
      </div>
    </li>
  );
}
