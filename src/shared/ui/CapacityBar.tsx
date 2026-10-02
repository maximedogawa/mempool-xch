"use client";

import { formatFixed } from "@/shared/i18n/number";
import { formatCost, formatPercent } from "@/shared/lib/chia/amounts";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import uiNs from "@/shared/i18n/messages/en/ui";

/**
 * Mempool capacity, in the spirit of mempool.space's memory-usage bar: a track split into
 * block-sized segments (the node's mempool holds ten blocks of cost), a gradient fill that
 * shifts from green to red as it fills, an animated sheen while the value moves, and the
 * numbers on top. Tone thresholds match the fee cards.
 */
export function CapacityBar({
  used,
  max,
  segmentCost,
  label: labelProp,
  compact = false,
  className,
}: {
  used: number;
  max: number;
  /** Cost per segment (block_max_cost); segments = max / segmentCost. */
  segmentCost?: number;
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const t = useT(uiNs);
  const label = labelProp ?? t("capacity.label");
  const ratio = max > 0 ? Math.min(1, used / max) : 0;
  const segments = segmentCost && segmentCost > 0 ? Math.max(1, Math.round(max / segmentCost)) : 10;
  const tone = ratio > 0.9 ? "hot" : ratio > 0.6 ? "warm" : "cool";
  const gradient = {
    cool: "linear-gradient(90deg, var(--fee-1) 0%, var(--fee-2) 100%)",
    warm: "linear-gradient(90deg, var(--fee-1) 0%, var(--fee-3) 100%)",
    hot: "linear-gradient(90deg, var(--fee-1) 0%, var(--fee-3) 55%, var(--fee-5) 100%)",
  }[tone];
  const text = tone === "hot" ? "text-danger" : tone === "warm" ? "text-warning" : "text-primary";
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {!compact ? (
        <div className="flex items-baseline justify-between gap-2 text-[11px] font-medium uppercase tracking-wider text-fg-muted">
          <span>{label}</span>
          <span
            className={cn("tabular text-xs normal-case tracking-normal", text)}
            title={t("capacity.costOf", { used: formatCost(used), max: formatCost(max) })}
          >
            {t("capacity.blocks", {
              percent: formatPercent(ratio),
              filled: formatFixed(ratio * segments, 1),
              segments,
            })}
          </span>
        </div>
      ) : null}
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(used)}
        aria-valuetext={t("capacity.valueText", {
          used: formatCost(used),
          max: formatCost(max),
          percent: formatPercent(ratio),
        })}
        className={cn(
          "relative w-full overflow-hidden rounded-full border border-border bg-bg",
          compact ? "h-2.5" : "h-3.5"
        )}
      >
        <div
          className="capacity-fill absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${Math.max(ratio > 0 ? 2 : 0, ratio * 100)}%`, background: gradient }}
        >
          <div aria-hidden="true" className="capacity-sheen absolute inset-0" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex">
          {Array.from({ length: segments }, (_, i) => (
            <div key={i} className={cn("flex-1", i > 0 && "border-l border-bg/70")} />
          ))}
        </div>
      </div>
    </div>
  );
}
