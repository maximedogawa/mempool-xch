/** Pure helpers for the confirmed/removed transaction page: waited time and a plain-language cost verdict. */
import { feePerCost, formatFeeRate, formatPercent, type Mojos } from "@/shared/lib/chia/amounts";

/**
 * Seconds between first-seen and the given end time (confirmation or removal), or null when
 * either side is unknown. Never negative: a first-seen sample can arrive slightly after the
 * event it is measuring, since both are independent observations, not one consensus fact.
 */
export function waitedSeconds(firstSeenMs: number | null, endMs: number | null): number | null {
  if (firstSeenMs === null || endMs === null) return null;
  return Math.max(0, (endMs - firstSeenMs) / 1000);
}

export interface CostVerdict {
  label: string;
  detail: string;
}

/** Plain-language read of what this transaction paid, for a reader who does not know CLVM cost. */
export function costVerdict(feeMojos: Mojos, cost: number, blockMaxCost: number): CostVerdict {
  if (cost <= 0)
    return {
      label: "No cost recorded",
      detail: "This summary was inferred from the chain, so cost and fee rate are not available.",
    };
  const share = blockMaxCost > 0 ? cost / blockMaxCost : 0;
  const shareText = `${formatPercent(share, share < 0.01 ? 2 : 1)} of a block`;
  if (feeMojos === 0n)
    return {
      label: "No fee paid",
      detail: `Used ${shareText}; the farmer included it for free, or it was small enough to fit anyway.`,
    };
  return {
    label: `${formatFeeRate(feePerCost(feeMojos, cost))} mojo/cost`,
    detail: `Used ${shareText} of the block for this fee rate.`,
  };
}
