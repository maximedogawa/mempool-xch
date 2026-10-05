"use client";

import { FEE_TARGETS_S, useFeeEstimate, useMempoolSummary } from "@/shared/api/hooks";
import { CHIA } from "@/shared/config/networks";
import { formatAmount, formatFeeRate, xchPlain } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { feeBandFor } from "@/shared/lib/mempool/feeBands";
import { formatInteger } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
import {
  CapacityBar,
  Card,
  CardBody,
  CardHeader,
  CopyButton,
  Skeleton,
  Tooltip,
} from "@/shared/ui";
import feesNs from "@/shared/i18n/messages/en/fees";

/** The seconds a target stands for; a nodexch gateway's quote is for 1, 3 and 10 blocks. */
const TARGET_LABELS = {
  60: "nextBlock",
  180: "threeMinutes",
  300: "fiveMinutes",
  600: "tenMinutes",
} as const satisfies Record<(typeof FEE_TARGETS_S)[number] | 180, string>;

function targetLabel(seconds: number): (typeof TARGET_LABELS)[keyof typeof TARGET_LABELS] {
  return TARGET_LABELS[seconds as keyof typeof TARGET_LABELS] ?? "nextBlock";
}

export function FeeCards() {
  const t = useT(feesNs);
  const fee = useFeeEstimate();
  const summary = useMempoolSummary();
  const state = summary.data?.state;
  const minFeeRate = state?.minFeeRate ?? 0;
  const fillRatio =
    state && state.mempoolMaxTotalCost > 0 ? state.mempoolCost / state.mempoolMaxTotalCost : 0;
  const zeroFeeOk = minFeeRate === 0 && fillRatio < 0.95;

  return (
    <Card>
      <CardHeader
        title={t("cards.title")}
        action={
          <Tooltip text={t("cards.hint", { cost: formatInteger(CHIA.REFERENCE_SPEND_COST) })} />
        }
      />
      <CardBody className="flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          {(fee.data?.targetTimes.length ? fee.data.targetTimes : FEE_TARGETS_S).map(
            (target, i) => {
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
                  <span className="flex items-start justify-between gap-1">
                    <span className="text-[11px] font-medium eyebrow text-fg-muted">
                      {t(`cards.targets.${targetLabel(target)}`)}
                    </span>
                    {/* A plain XCH decimal, ready for a wallet's fee field. */}
                    {estimate !== undefined ? (
                      <CopyButton
                        value={xchPlain(estimate)}
                        label={t("cards.copyXch", {
                          target: t(`cards.targets.${targetLabel(target)}`),
                        })}
                        className="-mr-1.5 -mt-1 h-6 w-6"
                      />
                    ) : null}
                  </span>
                  {fee.isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : rate !== null ? (
                    <>
                      <span className="tabular text-lg font-semibold leading-tight">
                        {formatFeeRate(rate)}{" "}
                        <span className="text-xs font-normal text-fg-muted">
                          {t("cards.mojoPerCost")}
                        </span>
                      </span>
                      <span className="tabular text-xs text-fg-faint">
                        {formatAmount(estimate!)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-fg-faint">{t("cards.notAvailable")}</span>
                  )}
                </div>
              );
            }
          )}
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
                <span className="font-semibold">{t("cards.capacityAvailable")}</span>{" "}
                <span className="text-fg-muted">{t("cards.zeroFeeAccepted")}</span>
              </>
            ) : (
              <>
                <span className="font-semibold">
                  {minFeeRate > 0
                    ? t("cards.aboveToEnter", { rate: formatFeeRate(Math.max(minFeeRate, 5)) })
                    : t("cards.nearCapacity")}
                </span>{" "}
                <span className="text-fg-muted">
                  {minFeeRate > 0 ? t("cards.fullMempool") : t("cards.paidAhead")}
                </span>
              </>
            )
          ) : null}
        </p>
        {fee.data &&
        fee.data.feesLastBlock !== null &&
        fee.data.feeRateLastBlock !== null &&
        fee.data.currentFeeRate !== null ? (
          <p className="text-xs text-fg-faint">
            {t("cards.lastBlock", {
              fees: formatAmount(fee.data.feesLastBlock),
              rate: formatFeeRate(fee.data.feeRateLastBlock),
              current: formatFeeRate(fee.data.currentFeeRate),
            })}
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
