"use client";

import { useEffect, useState } from "react";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { shortId } from "@/shared/lib/chia/hex";
import { formatAge } from "@/shared/lib/format/time";
import { usePoolLookup } from "@/shared/lib/pools/usePoolLookup";
import { routes } from "@/shared/lib/routes";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import type { RecentBlocksResult } from "@/shared/api/hooks";
import { useT } from "@/shared/i18n/useT";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tooltip } from "@/shared/ui/Tooltip";
import { WatchedBlockBadge } from "@/widgets/watchlist/WatchlistParts";
import { BlockCube } from "./BlockCube";
import { useBlocksAssetTotals } from "@/widgets/block/useBlock";

const CONFIRMED_GRADIENT = "var(--confirmed-fill)";

const CUBE = 138;

/** Stable colour per farmer puzzle hash so repeat farmers are recognisable at a glance. */
function farmerColor(ph: string): string {
  const hue = parseInt(ph.slice(0, 6), 16) % 360;
  return `hsl(${hue} 70% 60%)`;
}

function useNow(intervalMs = 10_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Count of non-transaction blocks between two consecutive transaction blocks. */
function gapBetween(all: BlockRecord[], newer: BlockRecord, older: BlockRecord): number {
  return all.filter(
    (r) => r.height < newer.height && r.height > older.height && !r.isTransactionBlock
  ).length;
}

export function RecentBlocks({
  data,
  watchedConfirmed,
  loading,
  blockMaxCost,
}: {
  data: RecentBlocksResult | undefined;
  watchedConfirmed?: ReadonlyMap<number, ReadonlySet<string>>;
  loading: boolean;
  blockMaxCost: number;
}) {
  const t = useT("blocks");
  const now = useNow();
  const lookupPool = usePoolLookup();
  // Only the newest cube animates, so the newest height already shown is all there is to keep.
  const [seen, setSeen] = useState<number | null>(null);
  const newest = data?.txBlocks[0]?.height;
  useEffect(() => {
    if (newest === undefined) return;
    const id = setTimeout(() => setSeen((s) => Math.max(s ?? 0, newest)), 800);
    return () => clearTimeout(id);
  }, [newest]);

  const totals = useBlocksAssetTotals(
    (data?.txBlocks ?? []).map((b) => ({ height: b.height, hash: b.headerHash }))
  );

  if (loading && !data) {
    return (
      <div className="flex items-end gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[156px] w-[156px]" />
        ))}
      </div>
    );
  }
  const blocks = data?.txBlocks ?? [];
  return (
    <ul className="flex min-w-max items-end gap-4" aria-label={t("recent.listLabel")}>
      {blocks.map((block, i) => {
        const watched = watchedConfirmed?.get(block.height)?.size ?? 0;
        const older = blocks[i + 1];
        const gap = older && data ? gapBetween(data.all, block, older) : 0;
        const fees = block.fees ?? 0n;
        const ageMs = (block.timestamp ?? 0) * 1000;
        const fill = Math.min(
          1,
          0.15 +
            Number(fees > 0n ? 0.35 : 0.1) +
            (block.rewardClaimsIncorporated?.length ?? 0) * 0.02
        );
        const pool = lookupPool(block.poolPuzzleHash);
        const label = t("recent.cubeLabel", {
          height: formatNumber(block.height),
          watched: watched ? t("recent.watchedPart", { count: watched }) : "",
          age: formatAge(ageMs, now),
          fees: formatAmount(fees),
          farmer: pool
            ? t("recent.farmedByPool", { pool: pool.name })
            : t("recent.farmerHash", { hash: shortId(block.farmerPuzzleHash) }),
        });
        return (
          <li key={block.height} className="flex items-end gap-3">
            <div className="flex flex-col items-center gap-1">
              <span className="tabular h-4 text-xs font-semibold text-fg-muted">
                {formatNumber(block.height)}
              </span>
              <BlockCube
                fill={fill}
                gradient={CONFIRMED_GRADIENT}
                variant="confirmed"
                href={routes.block(block.height)}
                ariaLabel={label}
                animate={i === 0 && (seen === null || block.height > seen)}
                size={CUBE}
                watched={watched > 0}
              >
                <span className="tabular text-[15px] font-bold leading-tight">
                  {formatAmount(fees)}
                </span>
                <span className="text-[10px] font-medium text-fg/70">{t("recent.totalFees")}</span>
                <span className="tabular mt-1.5 text-[11px] text-fg/85">
                  {totals[i]?.data
                    ? t("recent.moved", { amount: formatAmount(BigInt(totals[i]!.data!.xch)) })
                    : t("recent.rewardClaims", {
                        count: block.rewardClaimsIncorporated?.length ?? 0,
                      })}
                </span>
                <span className="tabular text-[11px] text-fg/75">{formatAge(ageMs, now)}</span>
                {watched ? <WatchedBlockBadge count={watched} /> : null}
              </BlockCube>
              <span
                className={cn(
                  "inline-flex h-5 max-w-[150px] items-center gap-1 truncate rounded-full border border-border bg-surface px-2 text-[10px] text-fg-muted",
                  !pool && "mono"
                )}
                title={
                  pool
                    ? t("recent.poolTitle", { pool: pool.name, hash: block.farmerPuzzleHash })
                    : t("recent.farmerTitle", { hash: block.farmerPuzzleHash })
                }
              >
                <span
                  aria-hidden="true"
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: farmerColor(block.farmerPuzzleHash) }}
                />
                {pool ? pool.name : shortId(block.farmerPuzzleHash, 5, 4)}
              </span>
            </div>
            {gap > 0 ? (
              <Tooltip
                text={t("recent.gap", {
                  count: gap,
                  newer: formatNumber(block.height),
                  older: formatNumber(older!.height),
                })}
              >
                <span className="mb-[72px] inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-border bg-surface px-1.5 text-[10px] text-fg-muted">
                  +{gap}
                </span>
              </Tooltip>
            ) : null}
          </li>
        );
      })}
      {blocks.length === 0 ? (
        <li className="text-sm text-fg-faint">
          {t("recent.empty", { cost: formatNumber(blockMaxCost) })}
        </li>
      ) : null}
    </ul>
  );
}
