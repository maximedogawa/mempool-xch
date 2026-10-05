"use client";

import { formatAmount, formatFeeRate, formatCost } from "@/shared/lib/chia/amounts";
import { formatEta } from "@/shared/lib/format/time";
import { feeGradient } from "@/shared/lib/mempool/feeBands";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { useT } from "@/shared/i18n/useT";
import { useWalletPendingIds } from "@/shared/lib/sage/usePendingIds";
import { WatchedBlockBadge } from "@/widgets/watchlist/WatchlistParts";
import { BlockCube, BlockCubeSkeleton } from "./BlockCube";
import blocksNs from "@/shared/i18n/messages/en/blocks";

const CUBE = 138;

/** Projected blocks, furthest-in-the-future on the left, next block right next to the divider. */
export function ProjectedBlocks({
  blocks,
  watchedIds,
  loading,
  selected,
  onSelect,
}: {
  blocks: ProjectedBlock[];
  watchedIds?: ReadonlySet<string>;
  loading: boolean;
  selected: number | null;
  onSelect: (index: number | null) => void;
}) {
  const t = useT(blocksNs);
  const mine = useWalletPendingIds();
  if (loading && blocks.length === 0) {
    return (
      <div className="flex items-end gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <BlockCubeSkeleton key={i} size={CUBE} />
        ))}
      </div>
    );
  }
  if (blocks.length === 0) {
    return (
      // Label and chip rows kept empty, so the column is as tall as a loaded block.
      <div className="flex flex-col items-center gap-1">
        <span aria-hidden="true" className="h-4" />
        <BlockCube
          fill={0}
          gradient=""
          variant="empty"
          ariaLabel={t("projected.emptyLabel")}
          size={CUBE}
        >
          <span className="text-xs text-fg-faint">{t("projected.empty")}</span>
          <span className="text-[11px] text-fg-faint">{t("projected.mempool")}</span>
        </BlockCube>
        <span aria-hidden="true" className="h-5" />
      </div>
    );
  }
  // Row-reversed so the next block sits against the divider and the scroll starts there.
  return (
    <ul
      className="flex min-w-max flex-row-reverse items-end gap-4"
      aria-label={t("projected.listLabel")}
    >
      {blocks.map((block) => {
        const watched = block.items.filter((item) => watchedIds?.has(item.id)).length;
        const zero = block.maxFeeRate === 0;
        const yours = mine.size ? block.items.filter((i) => mine.has(i.id)).length : 0;
        const label = t("projected.cubeLabel", {
          n: block.index + 1,
          bundles: t("projected.bundles", { count: block.items.length }),
          yours: yours ? t("projected.yoursPart", { count: yours }) : "",
          watched: watched ? t("projected.watchedPart", { count: watched }) : "",
          percent: Math.round(block.fill * 100),
          min: formatFeeRate(block.minFeeRate),
          max: formatFeeRate(block.maxFeeRate),
          eta: formatEta(block.etaSeconds),
        });
        return (
          <li key={block.index} className="blocks-snap flex flex-col items-center gap-1">
            <span className="tabular h-4 text-xs font-semibold text-fg-muted">
              {block.index === 0 ? t("projected.nextBlock") : `+${block.index}`}
            </span>
            <BlockCube
              fill={block.fill}
              gradient={feeGradient(block.minFeeRate, block.maxFeeRate)}
              variant="projected"
              ariaLabel={label}
              onClick={() => onSelect(selected === block.index ? null : block.index)}
              animate
              glow={block.index === 0}
              selected={selected === block.index}
              watched={watched > 0}
              size={CUBE}
            >
              <span className="tabular text-[15px] font-bold leading-tight">
                ~{zero ? "0" : formatFeeRate(block.medianFeeRate)}{" "}
                <span className="text-[10px] font-medium text-fg/70">mojo/cost</span>
              </span>
              <span className="tabular text-[10px] font-medium text-warning/90">
                {zero
                  ? t("projected.zeroFee")
                  : `${formatFeeRate(block.minFeeRate)} – ${formatFeeRate(block.maxFeeRate)} mojo/cost`}
              </span>
              <span className="tabular mt-1.5 text-[13px] font-semibold">
                {formatAmount(block.totalFee)}
              </span>
              <span className="tabular text-[11px] text-fg/80">
                {t("projected.txCount", {
                  count: block.items.length,
                  cost: formatCost(block.totalCost),
                })}
              </span>
              {watched ? <WatchedBlockBadge count={watched} /> : null}
              {yours ? (
                <span className="mt-1 inline-flex h-5 items-center rounded-full bg-primary px-2 text-[10px] font-bold uppercase tracking-wide text-primary-fg">
                  {t("projected.yours", { count: yours })}
                </span>
              ) : null}
            </BlockCube>
            {/* Opaque, so the queue's flow line passes behind the chip like a rail behind a stop. */}
            <span className="relative inline-flex h-5 items-center rounded-full border border-primary/40 bg-[color-mix(in_srgb,var(--primary)_14%,var(--surface))] px-2 text-[10px] font-semibold text-primary">
              {t("projected.inEta", { eta: formatEta(block.etaSeconds) })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
