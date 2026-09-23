/** Pure helpers for the confirmed/removed transaction page: waited time and a plain-language cost verdict. */
import { plainT } from "@/shared/i18n/plain";
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
  const t = plainT("tx");
  if (cost <= 0) return { label: t("verdict.noCostLabel"), detail: t("verdict.noCostDetail") };
  const share = blockMaxCost > 0 ? cost / blockMaxCost : 0;
  const shareText = t("verdict.share", { percent: formatPercent(share, share < 0.01 ? 2 : 1) });
  if (feeMojos === 0n)
    return {
      label: t("verdict.noFeeLabel"),
      detail: t("verdict.noFeeDetail", { share: shareText }),
    };
  return {
    label: `${formatFeeRate(feePerCost(feeMojos, cost))} mojo/cost`,
    detail: t("verdict.paidDetail", { share: shareText }),
  };
}
