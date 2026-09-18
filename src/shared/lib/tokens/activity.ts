import type { Mojos } from "@/shared/lib/chia/amounts";
import type { TxSummary } from "@/shared/lib/rpc/types";

/** Total of `assetId` received across every participant in `tx` (mirrors txAmountMoved for XCH). */
export function catAmountMoved(tx: TxSummary, assetId: string): Mojos {
  return tx.events.reduce(
    (sum, e) =>
      sum +
      e.participants.reduce(
        (s, p) =>
          s +
          p.received.cats.filter((c) => c.assetId === assetId).reduce((a, c) => a + c.amount, 0n),
        0n
      ),
    0n
  );
}

export interface TokenActivitySample {
  /** Earliest transaction Coinset has for this asset (exact: one ascending, limit-1 lookup). */
  firstSeenMs: number | null;
  /** Most recent transaction, from a bounded recent sample (exact: newest of a desc page). */
  lastSeenMs: number | null;
  /** Transactions in the bounded recent sample; `capped` means more exist beyond it. */
  sampledSpends: number;
  capped: boolean;
  /** Sum of `assetId` moved across the bounded recent sample only, not an all-time total. */
  sampledVolume: Mojos;
}

/** Reduces a bounded recent page (desc order) into the sampled activity figures. */
export function summariseRecentActivity(
  assetId: string,
  recent: TxSummary[],
  hasMore: boolean
): Omit<TokenActivitySample, "firstSeenMs"> {
  return {
    lastSeenMs: recent[0]?.confirmedAtMs ?? null,
    sampledSpends: recent.length,
    capped: hasMore,
    sampledVolume: recent.reduce((sum, tx) => sum + catAmountMoved(tx, assetId), 0n),
  };
}
