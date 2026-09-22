"use client";

import { useEffect, useState } from "react";
import { useBlockchainState, useRecentBlocks } from "@/shared/api/hooks";
import { CHIA } from "@/shared/config/networks";
import Link from "next/link";
import { formatNumber } from "@/shared/lib/chia/amounts";
import { formatBytes } from "@/shared/lib/charts/format";
import { cn } from "@/shared/lib/cn";
import { formatAge, formatDuration } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { Card, CardBody, CardHeader, Skeleton, Tooltip } from "@/shared/ui";
import { useReorgs } from "@/widgets/blocks/ReorgHistory";
import { formatFixed, numberFormat } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/**
 * Block timing, mempool.space's "difficulty adjustment" slot translated to Chia: a live
 * counter since the last transaction block with a progress bar toward the expected interval,
 * the observed average block time, and how many recent blocks carried transactions.
 */
export function BlockTime() {
  const t = useT("blocktime");
  const { settings } = useSettings();
  const state = useBlockchainState();
  const recent = useRecentBlocks(settings.recentBlocks);
  const now = useNow();
  const all = recent.data?.all ?? [];
  const txBlocks = recent.data?.txBlocks ?? [];
  const last = txBlocks[0];
  const sinceLast = last?.timestamp ? Math.max(0, now / 1000 - last.timestamp) : null;
  const avgBlock = state.data?.averageBlockTime ?? CHIA.TARGET_BLOCK_TIME_S;
  const txShare = all.length > 1 ? txBlocks.length / all.length : CHIA.TX_BLOCK_RATIO;
  const expectedInterval = avgBlock / Math.max(0.1, txShare);
  // Observed gap between the recent transaction blocks.
  const gaps = txBlocks
    .slice(0, -1)
    .map((b, i) => (b.timestamp ?? 0) - (txBlocks[i + 1]?.timestamp ?? 0))
    .filter((g) => g > 0);
  const observedInterval = gaps.length
    ? gaps.reduce((a, b) => a + b, 0) / gaps.length
    : expectedInterval;
  const progress = sinceLast !== null ? Math.min(1, sinceLast / expectedInterval) : 0;
  const overdue = sinceLast !== null && sinceLast > expectedInterval;
  const peak = state.data?.peak.height;
  // Netspace from Coinset's pushed estimate when the stream has one, else the node's own state.
  const pushed = useLiveValue("netspace");
  const lastReorg = useLiveValue("lastReorg");
  const netspace = pushed?.bytes ?? state.data?.space ?? null;
  const reorgs = useReorgs(1);
  const latestReorg = lastReorg
    ? { at: lastReorg.detectedAtMs, depth: lastReorg.depth, height: lastReorg.newPeakHeight }
    : reorgs.data?.reorgs[0]
      ? {
          at: reorgs.data.reorgs[0].detectedAtMs,
          depth: reorgs.data.reorgs[0].depth,
          height: reorgs.data.reorgs[0].newPeakHeight,
        }
      : null;
  const recentReorg = latestReorg !== null && now - latestReorg.at < 60 * 60_000;

  return (
    <Card>
      <CardHeader title={t("title")} action={<Tooltip text={t("hint")} />} />
      <CardBody className="flex flex-col gap-3">
        {!state.data ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  {t("sinceLast")}
                </div>
                <div
                  className={cn(
                    "tabular text-2xl font-semibold leading-tight",
                    overdue ? "text-warning" : "text-fg"
                  )}
                >
                  {sinceLast !== null ? formatDuration(sinceLast) : "…"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
                  {t("expectedGap")}
                </div>
                <div className="tabular text-lg font-semibold leading-tight">
                  ~{formatDuration(expectedInterval)}
                </div>
              </div>
            </div>
            <div
              role="meter"
              aria-label={t("progressLabel")}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              className="relative h-2.5 w-full overflow-hidden rounded-full border border-border bg-bg"
            >
              <div
                className={cn(
                  "capacity-fill absolute inset-y-0 left-0 rounded-full",
                  overdue
                    ? "bg-warning"
                    : "bg-[linear-gradient(90deg,var(--primary-strong),var(--accent))]"
                )}
                style={{ width: `${progress * 100}%` }}
              >
                <div aria-hidden="true" className="capacity-sheen absolute inset-0" />
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
              <div className="rounded-sm border border-border bg-bg px-2 py-2">
                <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                  {t("avgBlock")}
                </dt>
                <dd className="tabular text-sm font-semibold">
                  {t("seconds", { seconds: formatFixed(avgBlock, 1) })}
                </dd>
              </div>
              <div className="rounded-sm border border-border bg-bg px-2 py-2">
                <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                  {t("txBlocks")}
                </dt>
                <dd className="tabular text-sm font-semibold">
                  {numberFormat(undefined, { style: "percent", maximumFractionDigits: 0 }).format(
                    txShare
                  )}
                </dd>
              </div>
              <div className="rounded-sm border border-border bg-bg px-2 py-2">
                <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                  {t("observedGap")}
                </dt>
                <dd className="tabular text-sm font-semibold">
                  ~{formatDuration(observedInterval)}
                </dd>
              </div>
              <div
                className="rounded-sm border border-border bg-bg px-2 py-2"
                title={
                  pushed
                    ? t("pushedTitle", {
                        age: formatAge(pushed.at),
                        difficulty: formatNumber(pushed.difficulty),
                      })
                    : t("fromState")
                }
              >
                <dt className="text-[10px] font-medium uppercase tracking-wider text-fg-muted">
                  {t("netspace")}
                </dt>
                <dd className="tabular text-sm font-semibold" data-testid="netspace">
                  {netspace !== null ? formatBytes(Number(netspace)) : "…"}
                </dd>
              </div>
            </dl>
            <p className="text-[11px] text-fg-faint">
              {t("footer", {
                peak: peak !== undefined ? formatNumber(peak) : "…",
                last: last ? formatNumber(last.height) : "…",
                count: all.length,
              })}
              {latestReorg ? (
                <>
                  {" · "}
                  <Link
                    href={routes.blocks()}
                    className={cn(
                      "hover:underline",
                      recentReorg ? "font-medium text-warning" : undefined
                    )}
                    data-testid="reorg-indicator"
                  >
                    {t(recentReorg ? "reorgRecent" : "reorgLast", {
                      age: formatAge(latestReorg.at),
                      count: latestReorg.depth,
                      height: formatNumber(latestReorg.height),
                    })}
                  </Link>
                </>
              ) : null}
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
