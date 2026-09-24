"use client";

import { formatAmount, formatFeeRate, formatCost } from "@/shared/lib/chia/amounts";
import { formatEta } from "@/shared/lib/format/time";
import { feeGradient } from "@/shared/lib/mempool/feeBands";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { useT } from "@/shared/i18n/useT";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useWalletPendingIds } from "@/shared/lib/sage/usePendingIds";
import { WatchedBlockBadge } from "@/widgets/watchlist/WatchlistParts";
import { BlockCube } from "./BlockCube";
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
      <div className="flex items-end gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[156px] w-[156px]" />
        ))}
      </div>
    );
  }
  if (blocks.length === 0) {
    return (
      <BlockCube fill={0} gradient="" variant="empty" ariaLabel={t("projected.emptyLabel")}>
        <span className="text-xs text-fg-faint">{t("projected.empty")}</span>
        <span className="text-[11px] text-fg-faint">{t("projected.mempool")}</span>
      </BlockCube>
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
          <li key={block.index} className="flex flex-col items-center gap-1">
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
                <span className="mt-1 inline-flex h-5 items-center rounded-full bg-primary px-2 text-[10px] font-bold uppercase tracking-wide text-primary-fg shadow-[0_0_10px_var(--primary)]">
                  {t("projected.yours", { count: yours })}
                </span>
              ) : null}
            </BlockCube>
            <span className="inline-flex h-5 items-center rounded-full border border-primary/40 bg-primary-soft px-2 text-[10px] font-semibold text-primary">
              {t("projected.inEta", { eta: formatEta(block.etaSeconds) })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
