"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useProjectedBlocks } from "@/shared/api/hooks";
import { formatAmount, formatCost, formatFeeRate } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { shortId } from "@/shared/lib/chia/hex";
import { formatEta } from "@/shared/lib/format/time";
import { feeBandFor } from "@/shared/lib/mempool/feeBands";
import type { CompactMempoolItem, TxKindHint } from "@/shared/lib/mempool/types";
import { routes } from "@/shared/lib/routes";
import { squarify } from "@/shared/lib/treemap";
import { Card, CardBody, CardHeader, Skeleton } from "@/shared/ui";

const W = 800;
const H = 360;

type Filter = "all" | TxKindHint;
const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "xch", label: "XCH" },
  { id: "cat", label: "CAT" },
  { id: "nft", label: "NFT" },
  { id: "offer", label: "Offers" },
  { id: "did", label: "DID" },
];

const KIND_COLOR: Record<TxKindHint, string> = {
  xch: "var(--kind-xch)",
  cat: "var(--kind-cat)",
  nft: "var(--kind-nft)",
  did: "var(--kind-did)",
  offer: "var(--kind-offer)",
  singleton: "var(--kind-did)",
  unknown: "var(--kind-unknown)",
};

/**
 * "Goggles" for the next projected block, after mempool.space's block composition view: every
 * spend bundle that will make it into the next transaction block as a cell sized by CLVM cost
 * and coloured by fee band; the filter chips highlight one asset kind and dim the rest.
 */
export function NextBlockGoggles() {
  const { blocks, summary, isLoading } = useProjectedBlocks(8);
  const [filter, setFilter] = useState<Filter>("all");
  const [hover, setHover] = useState<CompactMempoolItem | null>(null);
  const next = blocks[0];
  const blockMax = summary?.state.blockMaxCost ?? 11_000_000_000;
  const cells = useMemo(() => (next ? squarify(next.items.map((item) => ({ item, weight: item.cost })), W, H * Math.max(0.15, next.fill)) : []), [next]);
  const counts = useMemo(() => {
    const c: Partial<Record<Filter, number>> = { all: next?.items.length ?? 0 };
    next?.items.forEach((i) => {
      c[i.kind] = (c[i.kind] ?? 0) + 1;
    });
    return c;
  }, [next]);
  const fillHeight = next ? H * Math.max(0.15, next.fill) : 0;
  const label = next
    ? `Next block composition: ${next.items.length} spend bundles, ${formatCost(next.totalCost)} of ${formatCost(blockMax)} cost, ${formatEta(next.etaSeconds)}`
    : "Next block composition";

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Next block
            {next ? <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] normal-case tracking-normal text-primary">{formatEta(next.etaSeconds)}</span> : null}
          </span>
        }
        action={
          <div role="group" aria-label="Filter by asset kind" className="flex flex-wrap gap-1">
            {FILTERS.filter((f) => f.id === "all" || (counts[f.id] ?? 0) > 0).map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
                  filter === f.id ? "border-primary bg-primary-soft text-primary" : "border-border text-fg-muted hover:text-fg"
                )}
              >
                {f.label} <span className="tabular font-normal text-fg-faint">{counts[f.id] ?? 0}</span>
              </button>
            ))}
          </div>
        }
      />
      <CardBody>
        {isLoading && !next ? (
          <Skeleton className="h-[220px] w-full" />
        ) : !next ? (
          <p className="py-10 text-center text-sm text-fg-faint">The mempool is empty: the next transaction block will carry no spends.</p>
        ) : (
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label} className="block h-auto w-full rounded-sm bg-bg">
              <title>{label}</title>
              {/* unused block space */}
              <rect x={0} y={fillHeight} width={W} height={Math.max(0, H - fillHeight)} fill="url(#emptyHatch)" />
              <defs>
                <pattern id="emptyHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="var(--border)" strokeWidth="1" />
                </pattern>
              </defs>
              {cells.map((cell) => {
                const item = cell.item;
                const band = feeBandFor(item.feeRate);
                const dim = filter !== "all" && item.kind !== filter;
                const big = cell.width > 64 && cell.height > 26;
                return (
                  <Link key={item.id} href={routes.tx(item.id)} aria-label={`Spend bundle ${shortId(item.id)}, ${item.kind}, cost ${formatCost(item.cost)}, ${formatFeeRate(item.feeRate)} mojo per cost`}>
                    <g
                      onMouseEnter={() => setHover(item)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(item)}
                      onBlur={() => setHover(null)}
                      style={{ opacity: dim ? 0.18 : 1, transition: "opacity 200ms" }}
                    >
                      <rect x={cell.x + 1} y={cell.y + 1} width={Math.max(0, cell.width - 2)} height={Math.max(0, cell.height - 2)} rx={2} fill={`var(${band.cssVar})`} fillOpacity={0.85} stroke={KIND_COLOR[item.kind]} strokeWidth={item.kind === "xch" ? 0 : 2} />
                      {big ? (
                        <>
                          <text x={cell.x + 6} y={cell.y + 15} fontSize="11" fontWeight="600" fill="#0a0d18" className="pointer-events-none">
                            {shortId(item.id, 5, 3)}
                          </text>
                          <text x={cell.x + 6} y={cell.y + 28} fontSize="10" fill="#0a0d18" fillOpacity="0.8" className="pointer-events-none">
                            {formatCost(item.cost)} · {formatFeeRate(item.feeRate)} m/c
                          </text>
                        </>
                      ) : null}
                    </g>
                  </Link>
                );
              })}
            </svg>
            {hover ? (
              <div role="status" className="pointer-events-none absolute left-2 top-2 rounded-sm border border-border bg-bg-elevated px-2.5 py-2 text-xs shadow-card">
                <div className="mono font-medium text-fg">{shortId(hover.id, 10, 6)}</div>
                <div className="text-fg-muted">
                  {hover.kind.toUpperCase()} · {formatCost(hover.cost)} cost · fee {formatAmount(BigInt(hover.fee))} ({formatFeeRate(hover.feeRate)} m/c)
                </div>
                <div className="text-fg-faint">moves {formatAmount(BigInt(hover.value))} · {hover.spends} coin spend{hover.spends === 1 ? "" : "s"}</div>
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-faint">
              <span>
                {next.items.length} bundles · {formatCost(next.totalCost)} of {formatCost(blockMax)} cost ({Math.round(next.fill * 100)}%) · fees {formatAmount(next.totalFee)}
              </span>
              <span>cell size = cost · colour = fee band · outline = asset kind</span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
