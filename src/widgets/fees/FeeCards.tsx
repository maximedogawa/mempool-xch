"use client";

import { FEE_TARGETS_S, useFeeEstimate, useMempoolSummary } from "@/shared/api/hooks";
import { CHIA } from "@/shared/config/networks";
import { formatAmount, formatFeeRate } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { feeBandFor } from "@/shared/lib/mempool/feeBands";
import { CapacityBar, Card, CardBody, CardHeader, Skeleton, Tooltip } from "@/shared/ui";

const TARGET_LABELS: Record<(typeof FEE_TARGETS_S)[number], string> = {
  60: "Next block",
  300: "~5 minutes",
  600: "~10 minutes",
};

const REFERENCE_HINT = `Chia fees are paid per CLVM cost, not per byte. Estimates are for a reference spend of ${CHIA.REFERENCE_SPEND_COST.toLocaleString("en-US")} cost (a typical single XCH send). Multiply the mojo-per-cost rate by your spend's cost for the fee.`;

export function FeeCards() {
  const fee = useFeeEstimate();
  const summary = useMempoolSummary();
  const state = summary.data?.state;
  const minFeeRate = state?.minFeeRate ?? 0;
  const fillRatio =
    state && state.mempoolMaxTotalCost > 0 ? state.mempoolCost / state.mempoolMaxTotalCost : 0;
  const zeroFeeOk = minFeeRate === 0 && fillRatio < 0.95;

  return (
    <Card>
      <CardHeader title="Transaction fees" action={<Tooltip text={REFERENCE_HINT} />} />
      <CardBody className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {FEE_TARGETS_S.map((target, i) => {
            const estimate = fee.data?.estimates[i];
            const rate =
              estimate !== undefined ? Number(estimate) / CHIA.REFERENCE_SPEND_COST : null;
            const band = rate !== null ? feeBandFor(rate) : null;
            return (
              <div
                key={target}
                className="flex flex-col gap-0.5 rounded-sm border border-border bg-bg px-3 py-2.5"
                style={band ? { borderBottom: `3px solid var(${band.cssVar})` } : undefined}
              >
                <span className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  {TARGET_LABELS[target]}
                </span>
                {fee.isLoading ? (
                  <Skeleton className="h-6 w-16" />
                ) : rate !== null ? (
                  <>
                    <span className="tabular text-lg font-semibold leading-tight">
                      {formatFeeRate(rate)}{" "}
                      <span className="text-xs font-normal text-fg-muted">mojo/cost</span>
                    </span>
                    <span className="tabular text-xs text-fg-faint">{formatAmount(estimate!)}</span>
                  </>
                ) : (
                  <span className="text-sm text-fg-faint">n/a</span>
                )}
              </div>
            );
          })}
        </div>
        {state ? (
          <CapacityBar
            used={state.mempoolCost}
            max={state.mempoolMaxTotalCost}
            segmentCost={state.blockMaxCost}
          />
        ) : (
          <Skeleton className="h-9 w-full" />
        )}
        <p className={cn("text-xs", zeroFeeOk ? "text-primary" : "text-warning")}>
          {state ? (
            zeroFeeOk ? (
              <>
                <span className="font-semibold">Capacity available.</span>{" "}
                <span className="text-fg-muted">0-fee spends are accepted.</span>
              </>
            ) : (
              <>
                <span className="font-semibold">
                  {minFeeRate > 0
                    ? `Above ${formatFeeRate(Math.max(minFeeRate, 5))} mojo/cost to enter.`
                    : "Near capacity."}
                </span>{" "}
                <span className="text-fg-muted">
                  {minFeeRate > 0
                    ? "A full mempool takes at least 5 mojo/cost and only above the cheapest spends it can evict."
                    : "Paid spends go ahead of the 0-fee backlog."}
                </span>
              </>
            )
          ) : null}
        </p>
        {fee.data ? (
          <p className="text-xs text-fg-faint">
            Last transaction block paid {formatAmount(fee.data.feesLastBlock)} in fees at{" "}
            {formatFeeRate(fee.data.feeRateLastBlock)} mojo/cost · current rate{" "}
            {formatFeeRate(fee.data.currentFeeRate)} mojo/cost.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
