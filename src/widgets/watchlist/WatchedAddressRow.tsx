"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import {
  describePending,
  EMPTY_TRACKED,
  pendingLine,
  trackPending,
  type TrackedState,
} from "@/shared/lib/wallet/pendingTracker";
import { receivesForP2 } from "@/shared/lib/watchlist/activity";
import type { WatchItem } from "@/shared/lib/watchlist/store";
import { routes } from "@/shared/lib/routes";
import { Hash } from "@/shared/ui";
import { useWatchedAddressPending } from "./useWatchedAddressPending";

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
  const pending = useWatchedAddressPending(item.id);
  const trackedRef = useRef<TrackedState>(EMPTY_TRACKED);
  const notifiedReceiveRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!pending.data) return;
    const ids = pending.data.transactions.map((tx) => tx.id).filter(Boolean);
    const { state, left } = trackPending(trackedRef.current, ids, Date.now());
    trackedRef.current = state;
    left.forEach((id) => onConfirmed(item, id));

    pending.data.transactions.forEach((tx) => {
      if (!tx.id || notifiedReceiveRef.current.has(tx.id)) return;
      if (receivesForP2(tx, item.id)) {
        notifiedReceiveRef.current.add(tx.id);
        onReceived(item, tx.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending.data]);

  const rows = pending.data?.transactions ?? [];

  return (
    <li className="flex flex-col gap-1.5 py-2.5 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Hash
          value={item.label}
          href={routes.address(item.label)}
          head={10}
          tail={6}
          className="min-w-0 flex-1 font-medium"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Stop watching ${item.label}`}
          className="rounded-sm p-1 text-fg-faint hover:text-fg"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
      {pending.isLoading ? (
        <span className="text-xs text-fg-faint">Checking for pending transactions…</span>
      ) : rows.length === 0 ? (
        <span className="text-xs text-fg-faint">No pending transactions</span>
      ) : (
        <ul className="flex flex-col gap-1 pl-1">
          {rows.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center justify-between gap-2 text-xs text-fg-muted"
            >
              <Hash value={tx.id} href={routes.tx(tx.id)} head={6} tail={4} />
              <span>{pendingLine(describePending(tx.id, projectedItems, projectedBlocks))}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
