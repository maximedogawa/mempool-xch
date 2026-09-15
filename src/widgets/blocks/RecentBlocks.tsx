"use client";

import { useEffect, useState } from "react";
import { formatAmount, formatNumber } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import type { RecentBlocksResult } from "@/shared/api/hooks";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tooltip } from "@/shared/ui/Tooltip";
import { BlockCube } from "./BlockCube";

const CONFIRMED_GRADIENT = "linear-gradient(160deg, var(--primary-strong) 0%, #1f6b8f 100%)";

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
  return all.filter((r) => r.height < newer.height && r.height > older.height && !r.isTransactionBlock).length;
}

export function RecentBlocks({ data, loading, blockMaxCost }: { data: RecentBlocksResult | undefined; loading: boolean; blockMaxCost: number }) {
  const now = useNow();
  const [seen, setSeen] = useState<Set<number>>(() => new Set());
  const newest = data?.txBlocks[0]?.height;
  useEffect(() => {
    if (newest === undefined) return;
    const id = setTimeout(() => setSeen((s) => new Set([...s, newest])), 800);
    return () => clearTimeout(id);
  }, [newest]);

  if (loading && !data) {
    return (
      <div className="flex items-end gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[140px] w-[140px]" />
        ))}
      </div>
    );
  }
  const blocks = data?.txBlocks ?? [];
  return (
    <ul className="flex min-w-max items-end gap-3" aria-label="Recent transaction blocks">
      {blocks.map((block, i) => {
        const older = blocks[i + 1];
        const gap = older && data ? gapBetween(data.all, block, older) : 0;
        const fees = block.fees ?? 0n;
        const ageMs = (block.timestamp ?? 0) * 1000;
        const fill = Math.min(1, 0.15 + Number(fees > 0n ? 0.35 : 0.1) + (block.rewardClaimsIncorporated?.length ?? 0) * 0.02);
        const label = `Block ${formatNumber(block.height)}, ${formatAge(ageMs, now)}, fees ${formatAmount(fees)}, farmer ${shortId(block.farmerPuzzleHash)}`;
        return (
          <li key={block.height} className="flex items-end gap-3">
            <div className="flex flex-col items-center gap-1">
              <span className="tabular text-xs font-semibold text-fg-muted">{formatNumber(block.height)}</span>
              <BlockCube
                fill={fill}
                gradient={CONFIRMED_GRADIENT}
                variant="confirmed"
                href={routes.block(block.height)}
                ariaLabel={label}
                animate={!seen.has(block.height) && i === 0}
              >
                <span className="tabular text-[13px] font-semibold leading-tight">{formatAmount(fees)}</span>
                <span className="text-[10px] uppercase tracking-wide text-fg/70">fees</span>
                <span className="tabular mt-1 text-[11px] text-fg/80">{block.rewardClaimsIncorporated?.length ?? 0} claims</span>
                <span className="tabular text-[11px] text-fg/80">{formatAge(ageMs, now)}</span>
                <span className="mono mt-1 max-w-[100px] truncate text-[10px] text-fg/60">{shortId(block.farmerPuzzleHash, 4, 4)}</span>
              </BlockCube>
            </div>
            {gap > 0 ? (
              <Tooltip text={`${gap} non-transaction block${gap > 1 ? "s" : ""} between ${formatNumber(block.height)} and ${formatNumber(older!.height)} (they carry no spends)`}>
                <span className="mb-10 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-border bg-surface px-1.5 text-[10px] text-fg-faint">
                  +{gap}
                </span>
              </Tooltip>
            ) : null}
          </li>
        );
      })}
      {blocks.length === 0 ? (
        <li className="text-sm text-fg-faint">No transaction blocks in the recent window ({formatNumber(blockMaxCost)} cost each).</li>
      ) : null}
    </ul>
  );
}
