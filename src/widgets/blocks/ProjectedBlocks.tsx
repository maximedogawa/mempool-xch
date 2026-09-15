"use client";

import { formatFeeRate, formatCost } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatEta } from "@/shared/lib/format/time";
import { feeGradient } from "@/shared/lib/mempool/feeBands";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { Skeleton } from "@/shared/ui/Skeleton";
import { BlockCube } from "./BlockCube";

/** Projected blocks, furthest-in-the-future on the left, next block right next to the divider. */
export function ProjectedBlocks({
  blocks,
  loading,
  selected,
  onSelect,
}: {
  blocks: ProjectedBlock[];
  loading: boolean;
  selected: number | null;
  onSelect: (index: number | null) => void;
}) {
  if (loading && blocks.length === 0) {
    return (
      <div className="flex items-end gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[140px] w-[140px]" />
        ))}
      </div>
    );
  }
  if (blocks.length === 0) {
    return (
      <BlockCube fill={0} gradient="" variant="empty" ariaLabel="Mempool is empty: the next block will carry no transactions">
        <span className="text-xs text-fg-faint">Empty</span>
        <span className="text-[11px] text-fg-faint">mempool</span>
      </BlockCube>
    );
  }
  // Row-reversed so the next block sits against the divider and the scroll starts there.
  return (
    <ul className="flex min-w-max flex-row-reverse items-end gap-3" aria-label="Projected next blocks">
      {blocks.map((block) => {
        const zero = block.maxFeeRate === 0;
        const label = `Projected block ${block.index + 1}: ${block.items.length} spend bundles, ${Math.round(block.fill * 100)}% full, fee rate ${formatFeeRate(block.minFeeRate)} to ${formatFeeRate(block.maxFeeRate)} mojo per cost, ${formatEta(block.etaSeconds)}`;
        return (
          <li key={block.index} className={cn("rounded-sm", block.index === 0 && "animate-next-block", selected === block.index && "ring-2 ring-primary ring-offset-2 ring-offset-bg")}>
            <BlockCube
              fill={block.fill}
              gradient={feeGradient(block.minFeeRate, block.maxFeeRate)}
              variant="projected"
              ariaLabel={label}
              onClick={() => onSelect(selected === block.index ? null : block.index)}
              animate
            >
              <span className="tabular text-[13px] font-semibold leading-tight">
                {zero ? "0" : `${formatFeeRate(block.minFeeRate)} – ${formatFeeRate(block.maxFeeRate)}`}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-fg/70">mojo / cost</span>
              <span className="tabular mt-1 text-[11px] text-fg/80">
                ~{formatFeeRate(block.medianFeeRate)} median
              </span>
              <span className="tabular text-[11px] text-fg/80">
                {formatCost(block.totalCost)} · {block.items.length} tx
              </span>
              <span className="mt-1 text-[11px] font-semibold text-primary">{formatEta(block.etaSeconds)}</span>
            </BlockCube>
          </li>
        );
      })}
    </ul>
  );
}
