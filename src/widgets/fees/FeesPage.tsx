"use client";

import { useState } from "react";
import { formatAmount, formatCost, formatFeeRate, formatNumber } from "@/shared/lib/chia/amounts";
import { Card, CardBody, CardHeader, Skeleton, StatTile } from "@/shared/ui";
import { ChartCard, type ChartSpec } from "@/widgets/charts/ChartCard";
import { ChartControls, type ChartControlsState } from "@/widgets/charts/ChartControls";
import { useBlocksChartSeries } from "@/widgets/charts/useChartSeries";
import { transferCostEstimates } from "./transferCosts";
import { useFeeEstimateTargets, useRateBracketDistribution, TARGET_TIMES_S, FEES_PAGE_REFERENCE_COST } from "./useFeesPageData";

const TARGET_LABELS: Record<number, string> = { 60: "1 min", 120: "2 min", 300: "5 min", 600: "10 min", 1800: "30 min" };

function formatTimeForRange(range: ChartControlsState["range"]): (t: number) => string {
  if (range === "6h" || range === "24h") return (t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (t) => new Date(t).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function FeesPage() {
  const [controls, setControls] = useState<ChartControlsState>({ range: "24h", smoothing: "smooth", scale: "linear" });
  const estimate = useFeeEstimateTargets();
  const distribution = useRateBracketDistribution();
  const blocks = useBlocksChartSeries(controls.range);
  const formatTime = formatTimeForRange(controls.range);

  const currentRate = estimate.data?.currentFeeRate ?? 0;
  const totalItems = distribution.rows?.reduce((s, r) => s + r.count, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold">Fees</h1>
        <p className="text-sm text-fg-muted">
          What the node estimates for a {formatCost(FEES_PAGE_REFERENCE_COST)}-cost transfer, the mempool&apos;s current rate distribution, and what common
          spend shapes cost at the going rate. Read on request from Coinset, nothing stored on our server (decision-012).
        </p>
      </header>

      <Card>
        <CardHeader title="Node estimate" />
        <CardBody className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {TARGET_TIMES_S.map((target, i) => {
              const mojos = estimate.data?.estimates[i];
              return (
                <StatTile
                  key={target}
                  label={`Within ${TARGET_LABELS[target]}`}
                  value={mojos !== undefined ? formatAmount(mojos) : "…"}
                  sub={mojos !== undefined ? `${formatFeeRate(Number(mojos) / FEES_PAGE_REFERENCE_COST)} mojo/cost` : undefined}
                />
              );
            })}
          </div>
          <p className="text-xs text-fg-faint">
            get_fee_estimate at {formatCost(FEES_PAGE_REFERENCE_COST)} cost. USD conversion is not shown: no verified public price-history endpoint exists
            yet (same gap as the Market chart on /charts).
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Rate distribution" action={<span className="text-xs text-fg-faint">{formatNumber(totalItems)} pending bundles</span>} />
        <CardBody>
          {distribution.rows ? (
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Rate distribution">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-fg-muted">
                    <th className="py-1.5 pr-3 font-semibold">Mojo/cost</th>
                    <th className="py-1.5 pr-3 font-semibold">Bundles</th>
                    <th className="py-1.5 font-semibold">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {distribution.rows.map((row) => (
                    <tr key={row.bracket.id} className="border-t border-border/60">
                      <td className="py-1.5 pr-3 font-medium text-fg">{row.bracket.label}</td>
                      <td className="tabular py-1.5 pr-3">{formatNumber(row.count)}</td>
                      <td className="tabular py-1.5">{row.count > 0 ? formatCost(row.cost) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Skeleton className="h-40" />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="What a transfer costs" action={<span className="text-xs text-fg-faint">at the current rate, {formatFeeRate(currentRate)} mojo/cost</span>} />
        <CardBody>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="What a transfer costs">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-fg-muted">
                  <th className="py-1.5 pr-3 font-semibold">Spend</th>
                  <th className="py-1.5 pr-3 font-semibold">Cost</th>
                  <th className="py-1.5 font-semibold">Fee</th>
                </tr>
              </thead>
              <tbody>
                {transferCostEstimates(currentRate).map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="py-1.5 pr-3 font-medium text-fg">{row.label}</td>
                    <td className="tabular py-1.5 pr-3 text-fg-faint">{formatCost(row.cost)}</td>
                    <td className="tabular py-1.5">{formatAmount(BigInt(Math.round(row.feeMojos)))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <ChartControls value={controls} onChange={setControls} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard
          spec={
            {
              title: "Fees per transaction block",
              definition: "Average total fees paid in a transaction block.",
              technical: "Averaged per sampling window from get_block_records (block_record.fees); bounded number of windows regardless of range.",
              formatValue: (v) => formatAmount(BigInt(Math.max(0, Math.round(v)))),
              formatTime,
            } satisfies ChartSpec
          }
          points={blocks.series?.fees ?? null}
          loading={blocks.isLoading}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
        <ChartCard
          spec={
            {
              title: "Median fee rate",
              definition: "The middle fee rate among transactions in a block, over time.",
              technical: "Not sampled at chart scale: needs each block's per-transaction costs (an indexed fetch per block), too heavy to sample across a range without a server-side cache (decision-012).",
              formatValue: (v) => formatFeeRate(v),
              formatTime,
            } satisfies ChartSpec
          }
          points={null}
          unavailable="Not sampled at chart scale — needs a per-block indexed fetch. Bundle fee rates in the mempool feed and transaction pages are exact."
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
      </div>
      <p className="text-xs text-fg-faint">Rates shown elsewhere — the mempool feed, transaction and block pages — are exact per-item figures, not sampled.</p>
    </div>
  );
}
