"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { feePerCost, formatAmount, formatCost, formatFeeRate } from "@/shared/lib/chia/amounts";
import { shortId } from "@/shared/lib/chia/hex";
import { feeBandFor } from "@/shared/lib/mempool/feeBands";
import { routes } from "@/shared/lib/routes";
import type { TxSummary } from "@/shared/lib/rpc/types";
import { squarify } from "@/shared/lib/treemap";

const W = 800;
const H = 320;

/** Block content as a treemap: cell area = cost, colour = fee per cost band. */
export function BlockTreemap({ transactions, blockCost }: { transactions: TxSummary[]; blockCost: number }) {
  const [hover, setHover] = useState<TxSummary | null>(null);
  const cells = useMemo(
    () => squarify(transactions.map((tx) => ({ item: tx, weight: tx.cost })), W, H),
    [transactions]
  );
  const total = transactions.reduce((s, t) => s + t.cost, 0);
  if (cells.length === 0) {
    return <p className="py-6 text-center text-sm text-fg-faint">No cost data for this block.</p>;
  }
  const label = `Treemap of ${transactions.length} transactions sized by cost (${formatCost(total)} of ${formatCost(blockCost)}) and coloured by fee per cost`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label} className="block h-auto max-h-[320px] w-full rounded-sm">
        <title>{label}</title>
        {cells.map((cell) => {
          const tx = cell.item;
          const rate = feePerCost(tx.feeMojos, tx.cost);
          const band = feeBandFor(rate);
          const big = cell.width > 70 && cell.height > 28;
          return (
            <Link key={tx.id} href={routes.tx(tx.id)} aria-label={`Transaction ${shortId(tx.id)}, cost ${formatCost(tx.cost)}, fee ${formatAmount(tx.feeMojos)}`}>
              <g onMouseEnter={() => setHover(tx)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(tx)} onBlur={() => setHover(null)}>
                <rect
                  x={cell.x + 1}
                  y={cell.y + 1}
                  width={Math.max(0, cell.width - 2)}
                  height={Math.max(0, cell.height - 2)}
                  rx={3}
                  fill={`var(${band.cssVar})`}
                  fillOpacity={hover?.id === tx.id ? 1 : 0.8}
                  stroke="var(--bg)"
                  strokeWidth={1}
                />
                {big ? (
                  <text x={cell.x + 6} y={cell.y + 16} fontSize="11" fill="#fff" fillOpacity={0.95} className="mono pointer-events-none">
                    {shortId(tx.id, 6, 4)}
                  </text>
                ) : null}
                {big && cell.height > 44 ? (
                  <text x={cell.x + 6} y={cell.y + 32} fontSize="10" fill="#fff" fillOpacity={0.8} className="pointer-events-none">
                    {formatCost(tx.cost)} · {formatFeeRate(rate)} m/c
                  </text>
                ) : null}
              </g>
            </Link>
          );
        })}
      </svg>
      {hover ? (
        <div role="status" className="pointer-events-none absolute left-2 top-2 rounded-sm border border-border bg-bg-elevated px-2.5 py-2 text-xs shadow-card">
          <div className="mono text-fg">{shortId(hover.id, 10, 8)}</div>
          <div className="text-fg-muted">Cost {formatCost(hover.cost)} · Fee {formatAmount(hover.feeMojos)} · {formatFeeRate(feePerCost(hover.feeMojos, hover.cost))} mojo/cost</div>
        </div>
      ) : null}
    </div>
  );
}
