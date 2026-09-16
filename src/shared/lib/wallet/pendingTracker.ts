/**
 * Pure helpers behind the dashboard's "your transactions in flight" panel (TASK-042): where a
 * wallet transaction stands relative to the mempool summary and the projected blocks, and
 * which ids just left the wallet's pending list (candidates for "confirmed").
 */
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import { findProjectedPosition, type ProjectedBlock } from "@/shared/lib/mempool/packing";
import { feeBandFor, type FeeBand } from "@/shared/lib/mempool/feeBands";

export type PendingPhase =
  /** Sage reports it pending but the summarised mempool has not seen it yet. */
  | "broadcast"
  /** In the mempool and packed into a projected block. */
  | "queued"
  /** In the mempool but not packed into the projected window (far down the queue). */
  | "waiting"
  /** Left the pending list and was seen confirmed. */
  | "confirmed"
  /** Left the pending list without a confirmation we could see. */
  | "gone";

export interface PendingStatus {
  phase: PendingPhase;
  /** 0-based projected block index (0 = next block). */
  blockIndex: number | null;
  /** 1-based position inside that block. */
  position: number | null;
  blockSize: number | null;
  etaSeconds: number | null;
  feeRate: number | null;
  band: FeeBand | null;
  /** How many projected blocks exist, for the mini queue. */
  blocksAhead: number;
}

export function describePending(txId: string, items: CompactMempoolItem[] | undefined, blocks: ProjectedBlock[]): PendingStatus {
  const id = txId.toLowerCase().replace(/^0x/, "");
  const item = items?.find((i) => i.id === id);
  if (!item) return { phase: "broadcast", blockIndex: null, position: null, blockSize: null, etaSeconds: null, feeRate: null, band: null, blocksAhead: blocks.length };
  const found = findProjectedPosition(blocks, id);
  if (!found) return { phase: "waiting", blockIndex: null, position: null, blockSize: null, etaSeconds: null, feeRate: item.feeRate, band: feeBandFor(item.feeRate), blocksAhead: blocks.length };
  return {
    phase: "queued",
    blockIndex: found.block.index,
    position: found.position + 1,
    blockSize: found.block.items.length,
    etaSeconds: found.block.etaSeconds,
    feeRate: item.feeRate,
    band: feeBandFor(item.feeRate),
    blocksAhead: blocks.length,
  };
}

export interface TrackedState {
  /** Ids seen pending, with the time they were first seen. */
  seen: Record<string, number>;
}

export const EMPTY_TRACKED: TrackedState = { seen: {} };

/** Fold the wallet's current pending ids in; returns the ids that were pending before and are not now. */
export function trackPending(state: TrackedState, pendingIds: string[], now: number): { state: TrackedState; left: string[] } {
  const current = new Set(pendingIds.map((i) => i.toLowerCase()));
  const seen: Record<string, number> = {};
  const left: string[] = [];
  Object.entries(state.seen).forEach(([id, at]) => {
    if (current.has(id)) seen[id] = at;
    else left.push(id);
  });
  current.forEach((id) => {
    if (!(id in seen)) seen[id] = state.seen[id] ?? now;
  });
  return { state: { seen }, left };
}

/** Human line for a status. */
export function pendingLine(s: PendingStatus): string {
  switch (s.phase) {
    case "broadcast":
      return "Sent to the network, not seen in the mempool yet";
    case "waiting":
      return "In the mempool, behind the projected blocks";
    case "queued":
      return s.blockIndex === 0 ? `Next block · position ${s.position} of ${s.blockSize}` : `Projected block ${(s.blockIndex ?? 0) + 1} · position ${s.position} of ${s.blockSize}`;
    case "confirmed":
      return "Confirmed";
    case "gone":
      return "No longer pending in the wallet";
  }
}
