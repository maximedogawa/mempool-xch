"use client";

import Link from "next/link";
import { useMempoolSummary } from "@/shared/api/hooks";
import { formatAmount, formatCost, formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { FEE_BANDS } from "@/shared/lib/mempool/feeBands";
import { routes } from "@/shared/lib/routes";
import { CapacityBar, Card, CardBody, CardHeader, StatTile } from "@/shared/ui";
import { StackedAreaChart } from "@/shared/ui/charts/StackedAreaChart";
import { intlTag } from "@/shared/i18n/active";
import { formatFixed } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
import { useMempoolHistory } from "./useMempoolHistory";

const formatClock = (t: number) =>
  new Date(t).toLocaleTimeString(intlTag(), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

function incomingPerMinute(items: { firstSeen: number }[], now: number): number {
  const window = 10 * 60_000;
  const recent = items.filter((i) => now - i.firstSeen <= window).length;
  return recent / 10;
}

export function MempoolStats() {
  const t = useT("mempool");
  const series = FEE_BANDS.map((b) => ({
    id: b.id,
    label: t("bandLabel", { band: b.label }),
    color: `var(${b.cssVar})`,
  }));
  const summary = useMempoolSummary();
  const { history, startedAt } = useMempoolHistory();
  const state = summary.data?.state;
  const items = summary.data?.items ?? [];
  const now = Date.now();
  const fill =
    state && state.mempoolMaxTotalCost > 0 ? state.mempoolCost / state.mempoolMaxTotalCost : 0;
  return (
    <Card>
      <CardHeader
        title={t("title")}
        action={
          <Link href={routes.mempool()} className="text-xs font-medium text-accent hover:underline">
            {t("viewAll")}
          </Link>
        }
      />
      <CardBody className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatTile
            label={t("spendBundles")}
            value={state ? formatNumber(state.mempoolSize) : "…"}
            sub={
              items.length !== state?.mempoolSize && state
                ? t(items.length < state.mempoolSize ? "summarisedSyncing" : "summarised", {
                    count: formatNumber(items.length),
                  })
                : undefined
            }
            hint={t("spendBundlesHint")}
          />
          <StatTile
            label={t("costUsed")}
            value={state ? formatPercent(fill) : "…"}
            sub={
              state ? (
                <CapacityBar
                  compact
                  used={state.mempoolCost}
                  max={state.mempoolMaxTotalCost}
                  segmentCost={state.blockMaxCost}
                  className="mt-1"
                />
              ) : undefined
            }
            tone={fill > 0.9 ? "danger" : fill > 0.6 ? "warning" : "default"}
            hint={t("costUsedHint")}
          />
          <StatTile
            label={t("totalFees")}
            value={state ? formatAmount(BigInt(state.mempoolFees)) : "…"}
          />
          <StatTile
            label={t("incoming")}
            value={
              summary.data
                ? t("perMinute", { rate: formatFixed(incomingPerMinute(items, now), 1) })
                : "…"
            }
            sub={t("lastTenMinutes")}
            hint={t("incomingHint")}
          />
        </div>
        <StackedAreaChart
          series={series}
          points={history.map((s) => ({ t: s.t, values: s.bands }))}
          formatValue={(v) => formatCost(v)}
          formatTime={formatClock}
          ariaLabel={t("chartLabel")}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-faint">
          <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label={t("feeBands")}>
            {FEE_BANDS.map((b) => (
              <li key={b.id} className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: `var(${b.cssVar})` }}
                  aria-hidden="true"
                />
                {t("bandLabel", { band: b.label })}
              </li>
            ))}
          </ul>
          <span>
            {startedAt ? t("sampledSince", { time: formatClock(startedAt) }) : t("historyStarts")}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
