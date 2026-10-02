"use client";

import { useState } from "react";
import { formatAmount, formatCost, formatFeeRate, formatNumber } from "@/shared/lib/chia/amounts";
import { Card, CardBody, CardHeader, Skeleton, StatTile } from "@/shared/ui";
import { Tooltip } from "@/shared/ui/Tooltip";
import { intlTag } from "@/shared/i18n/active";
import { useT } from "@/shared/i18n/useT";
import { ChartCard, type ChartSpec } from "@/widgets/charts/ChartCard";
import { ChartControls, type ChartControlsState } from "@/widgets/charts/ChartControls";
import { useBlocksChartSeries } from "@/widgets/charts/useChartSeries";
import { transferCostEstimates } from "./transferCosts";
import {
  useFeeEstimateTargets,
  useRateBracketDistribution,
  TARGET_TIMES_S,
  FEES_PAGE_REFERENCE_COST,
} from "./useFeesPageData";
import feesNs from "@/shared/i18n/messages/en/fees";

function formatTimeForRange(range: ChartControlsState["range"]): (t: number) => string {
  if (range === "6h" || range === "24h")
    return (t) =>
      new Date(t).toLocaleTimeString(intlTag(), {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      });
  return (t) => new Date(t).toLocaleDateString(intlTag(), { day: "2-digit", month: "short" });
}

export function FeesPage() {
  const t = useT(feesNs);
  const [controls, setControls] = useState<ChartControlsState>({
    range: "24h",
    smoothing: "smooth",
    scale: "linear",
  });
  const estimate = useFeeEstimateTargets();
  const distribution = useRateBracketDistribution();
  const blocks = useBlocksChartSeries(controls.range);
  const formatTime = formatTimeForRange(controls.range);

  const currentRate = estimate.data?.currentFeeRate ?? 0;
  const totalItems = distribution.rows?.reduce((s, r) => s + r.count, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{t("page.title")}</h1>
          <Tooltip
            text={t("page.intro", { cost: formatCost(FEES_PAGE_REFERENCE_COST) })}
            placement="bottom"
          />
        </div>
      </header>

      <Card>
        <CardHeader title={t("page.nodeEstimate")} />
        <CardBody className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {TARGET_TIMES_S.map((target, i) => {
              const mojos = estimate.data?.estimates[i];
              return (
                <StatTile
                  key={target}
                  label={t("page.withinMinutes", { count: target / 60 })}
                  value={mojos !== undefined ? formatAmount(mojos) : "…"}
                  sub={
                    mojos !== undefined
                      ? t("page.rateSub", {
                          rate: formatFeeRate(Number(mojos) / FEES_PAGE_REFERENCE_COST),
                        })
                      : undefined
                  }
                />
              );
            })}
          </div>
          <p className="text-xs text-fg-faint">
            {t("page.estimateNote", { cost: formatCost(FEES_PAGE_REFERENCE_COST) })}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={t("page.rateDistribution")}
          action={
            <span className="text-xs text-fg-faint">
              {t("page.pendingBundles", { count: totalItems })}
            </span>
          }
        />
        <CardBody>
          {distribution.rows ? (
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={t("page.rateDistribution")}
            >
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-fg-muted">
                    <th className="py-1.5 pr-3 font-semibold">{t("page.colRate")}</th>
                    <th className="py-1.5 pr-3 font-semibold">{t("page.colBundles")}</th>
                    <th className="py-1.5 font-semibold">{t("page.colCost")}</th>
                  </tr>
                </thead>
                <tbody>
                  {distribution.rows.map((row) => (
                    <tr key={row.bracket.id} className="border-t border-border/60">
                      <td className="py-1.5 pr-3 font-medium text-fg">{row.bracket.label}</td>
                      <td className="tabular py-1.5 pr-3">{formatNumber(row.count)}</td>
                      <td className="tabular py-1.5">
                        {row.count > 0 ? formatCost(row.cost) : "—"}
                      </td>
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
        <CardHeader
          title={t("page.transferTitle")}
          action={
            <span className="text-xs text-fg-faint">
              {t("page.atCurrentRate", { rate: formatFeeRate(currentRate) })}
            </span>
          }
        />
        <CardBody>
          <div
            className="overflow-x-auto"
            tabIndex={0}
            role="region"
            aria-label={t("page.transferTitle")}
          >
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-fg-muted">
                  <th className="py-1.5 pr-3 font-semibold">{t("page.colSpend")}</th>
                  <th className="py-1.5 pr-3 font-semibold">{t("page.colCost")}</th>
                  <th className="py-1.5 font-semibold">{t("page.colFee")}</th>
                </tr>
              </thead>
              <tbody>
                {transferCostEstimates(currentRate).map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="py-1.5 pr-3 font-medium text-fg">{t(`transfers.${row.id}`)}</td>
                    <td className="tabular py-1.5 pr-3 text-fg-faint">{formatCost(row.cost)}</td>
                    <td className="tabular py-1.5">
                      {formatAmount(BigInt(Math.round(row.feeMojos)))}
                    </td>
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
              title: t("page.feesChart.title"),
              definition: t("page.feesChart.definition"),
              technical: t("page.feesChart.technical"),
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
              title: t("page.medianChart.title"),
              definition: t("page.medianChart.definition"),
              technical: t("page.medianChart.technical"),
              formatValue: (v) => formatFeeRate(v),
              formatTime,
            } satisfies ChartSpec
          }
          points={null}
          unavailable={t("page.medianChart.unavailable")}
          smoothing={controls.smoothing}
          scale={controls.scale}
        />
      </div>
      <p className="text-xs text-fg-faint">{t("page.footer")}</p>
    </div>
  );
}
