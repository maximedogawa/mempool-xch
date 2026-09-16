"use client";

import Link from "next/link";
import { useMempoolSummary } from "@/shared/api/hooks";
import { formatAmount, formatCost, formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import { FEE_BANDS } from "@/shared/lib/mempool/feeBands";
import { routes } from "@/shared/lib/routes";
import { CapacityBar, Card, CardBody, CardHeader, StatTile } from "@/shared/ui";
import { StackedAreaChart } from "@/shared/ui/charts/StackedAreaChart";
import { useMempoolHistory } from "./useMempoolHistory";

const SERIES = FEE_BANDS.map((b) => ({ id: b.id, label: `${b.label} mojo/cost`, color: `var(${b.cssVar})` }));

function incomingPerMinute(items: { firstSeen: number }[], now: number): number {
  const window = 10 * 60_000;
  const recent = items.filter((i) => now - i.firstSeen <= window).length;
  return recent / 10;
}

export function MempoolStats() {
  const summary = useMempoolSummary();
  const { history, startedAt } = useMempoolHistory();
  const state = summary.data?.state;
  const items = summary.data?.items ?? [];
  const now = Date.now();
  const fill = state && state.mempoolMaxTotalCost > 0 ? state.mempoolCost / state.mempoolMaxTotalCost : 0;
  return (
    <Card>
      <CardHeader
        title="Mempool"
        action={
          <Link href={routes.mempool()} className="text-xs font-medium text-accent hover:underline">
            View all →
          </Link>
        }
      />
      <CardBody className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatTile
            label="Spend bundles"
            value={state ? formatNumber(state.mempoolSize) : "…"}
            sub={items.length !== state?.mempoolSize && state ? `${formatNumber(items.length)} summarised${items.length < state.mempoolSize ? " · syncing" : ""}` : undefined}
            hint="Count reported by the node. When the summary is still catching up after a restart the summarised number is lower for a few seconds."
          />
          <StatTile
            label="Cost used"
            value={state ? formatPercent(fill) : "…"}
            sub={state ? <CapacityBar compact used={state.mempoolCost} max={state.mempoolMaxTotalCost} segmentCost={state.blockMaxCost} className="mt-1" /> : undefined}
            tone={fill > 0.9 ? "danger" : fill > 0.6 ? "warning" : "default"}
            hint="Total CLVM cost of all pending spend bundles versus the node's mempool limit (10 blocks worth)."
          />
          <StatTile label="Total fees" value={state ? formatAmount(BigInt(state.mempoolFees)) : "…"} />
          <StatTile label="Incoming" value={summary.data ? `${incomingPerMinute(items, now).toFixed(1)}/min` : "…"} sub="last 10 minutes" hint="Spend bundles first seen in the last ten minutes, per minute." />
        </div>
        <StackedAreaChart
          series={SERIES}
          points={history.map((s) => ({ t: s.t, values: s.bands }))}
          formatValue={(v) => formatCost(v)}
          formatTime={(t) => new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          ariaLabel="Mempool cost by fee band over time"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-faint">
          <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="Fee bands">
            {FEE_BANDS.map((b) => (
              <li key={b.id} className="inline-flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-sm" style={{ background: `var(${b.cssVar})` }} aria-hidden="true" />
                {b.label} mojo/cost
              </li>
            ))}
          </ul>
          <span>
            {startedAt
              ? `Sampled in this browser since ${new Date(startedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} (2h window)`
              : "History starts when the app is first opened"}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
