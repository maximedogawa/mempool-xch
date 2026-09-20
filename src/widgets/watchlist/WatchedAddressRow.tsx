"use client";

import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Eye, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import { describePending } from "@/shared/lib/wallet/pendingTracker";
import { receivesForP2 } from "@/shared/lib/watchlist/activity";
import type { WatchItem } from "@/shared/lib/watchlist/store";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { routes } from "@/shared/lib/routes";
import { Hash } from "@/shared/ui";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { deriveAddressFlow } from "@/widgets/address/deriveFlow";
import { useWatchedAddressHistory, useWatchedAddressPending } from "./useWatchedAddressPending";
import { ReceivedAssets, RemoveWatch, WatchQueue, WatchStatus } from "./WatchlistParts";

export function WatchedAddressRow({
  item,
  projectedItems,
  projectedBlocks,
  onConfirmed,
  onReceived,
  onRemove,
}: {
  item: WatchItem;
  projectedItems: CompactMempoolItem[] | undefined;
  projectedBlocks: ProjectedBlock[];
  onConfirmed: (item: WatchItem, txId: string) => void;
  onReceived: (item: WatchItem, txId: string) => void;
  onRemove: () => void;
}) {
  const { client, endpoints } = useSettings();
  const pending = useWatchedAddressPending(item.id);
  const history = useWatchedAddressHistory(item.id);
  const seen = useRef(new Set<string>());
  const notified = useRef(new Set<string>());
  useEffect(() => {
    seen.current.clear();
    notified.current.clear();
  }, [endpoints.network, client]);
  useEffect(() => {
    if (pending.isError) return;
    for (const tx of pending.data?.transactions ?? []) {
      if (tx.status !== "pending") continue;
      if (!seen.current.has(tx.id) && receivesForP2(tx, item.id)) onReceived(item, tx.id);
      seen.current.add(tx.id);
    }
    const settled = [
      ...(pending.data?.transactions ?? []),
      ...(history.isError ? [] : (history.data?.transactions ?? [])),
    ];
    for (const tx of settled) {
      if (tx.status === "confirmed" && seen.current.has(tx.id) && !notified.current.has(tx.id)) {
        notified.current.add(tx.id);
        onConfirmed(item, tx.id);
      }
    }
    // Bound session tracking even for addresses with continuous activity.
    if (seen.current.size > 500) {
      const recent = [...seen.current].slice(-250);
      seen.current = new Set(recent);
      notified.current = new Set([...notified.current].filter((id) => seen.current.has(id)));
    }
  }, [pending.data, pending.isError, history.data, history.isError, item, onConfirmed, onReceived]);

  const rows = (pending.data?.transactions ?? []).filter((tx) => tx.status === "pending");
  const latest = history.data?.transactions.find((tx) => tx.status === "confirmed");
  return (
    <li className="min-w-0 rounded-xl border border-border bg-bg/50 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary-soft text-primary">
          <Wallet size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
              Address
            </span>
            <WatchStatus pending={rows.length > 0 && !pending.isError}>
              <Eye size={11} aria-hidden="true" />
              {!client.hasIndexed
                ? "Unavailable"
                : pending.isError
                  ? "Connection issue"
                  : pending.isLoading
                    ? "Checking…"
                    : rows.length
                      ? `${pending.data?.truncated ? "At least " : ""}${rows.length} pending`
                      : "Watching"}
            </WatchStatus>
          </div>
          <Hash
            value={item.label}
            href={routes.address(item.label)}
            head={10}
            tail={6}
            copy
            className="text-sm font-semibold"
          />
        </div>
        <RemoveWatch label={item.label} onRemove={onRemove} />
      </div>
      <div className="mt-3 border-t border-border/60 pt-3">
        {!client.hasIndexed ? (
          <p className="text-xs text-fg-muted">Address activity needs a Coinset endpoint.</p>
        ) : pending.isError ? (
          <p role="status" className="text-xs text-danger">
            Could not refresh activity.{" "}
            <button className="underline" onClick={() => void pending.refetch()}>
              Retry
            </button>
          </p>
        ) : pending.isLoading ? (
          <p className="text-xs text-fg-faint">Checking for pending transactions…</p>
        ) : rows.length ? (
          <ul className="flex flex-col gap-2">
            {rows.slice(0, 5).map((tx) => {
              const flow = deriveAddressFlow(tx, item.id);
              const incoming = flow.direction === "in";
              return (
                <li
                  key={tx.id}
                  className="rounded-lg border border-warning/15 bg-warning/5 px-3 py-2.5"
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-fg-muted">
                      {incoming ? (
                        <ArrowDownLeft size={13} aria-hidden="true" />
                      ) : (
                        <ArrowUpRight size={13} aria-hidden="true" />
                      )}
                      <Hash value={tx.id} href={routes.tx(tx.id)} head={8} tail={6} />
                    </span>
                    {flow.xch !== 0n ? (
                      <span className="tabular font-medium">
                        {flow.xch > 0n ? "+" : "−"}
                        {formatAmount(flow.xch < 0n ? -flow.xch : flow.xch)}
                      </span>
                    ) : null}
                  </div>
                  <WatchQueue status={describePending(tx.id, projectedItems, projectedBlocks)} />
                  <div className="mt-2">
                    <ReceivedAssets tx={tx} p2={item.id} pending />
                  </div>
                </li>
              );
            })}
            {rows.length > 5 || pending.data?.truncated ? (
              <li>
                <Link
                  href={routes.address(item.label)}
                  className="text-xs text-accent hover:underline"
                >
                  View all pending activity →
                </Link>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="text-xs text-fg-faint">No pending transactions</p>
        )}
        {latest && !history.isError ? (
          <div className="mt-3">
            <ReceivedAssets tx={latest} p2={item.id} />
          </div>
        ) : null}
        {latest && !history.isError ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
            <CheckCircle2 size={13} className="text-primary" aria-hidden="true" />
            <span>Latest confirmation</span>
            <Hash value={latest.id} href={routes.tx(latest.id)} head={6} tail={4} />
            {latest.confirmedHeight !== null ? (
              <Link
                href={routes.block(latest.confirmedHeight)}
                className="tabular ml-auto text-primary hover:underline"
              >
                Block {formatNumber(latest.confirmedHeight)}
              </Link>
            ) : null}
          </div>
        ) : history.isError ? (
          <p className="mt-2 text-xs text-fg-faint">Recent confirmations unavailable.</p>
        ) : null}
      </div>
    </li>
  );
}
