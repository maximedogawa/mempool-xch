"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMempoolSummary, useRecentBlocks } from "@/shared/api/hooks";
import { formatAmount, formatCost, formatFeeRate, formatNumber } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { useWalletPendingIds } from "@/shared/lib/sage/usePendingIds";
import {
  AssetAmount,
  AssetBadge,
  Card,
  CardBody,
  CardHeader,
  Hash,
  Skeleton,
  YoursChip,
} from "@/shared/ui";
import feedNs from "@/shared/i18n/messages/en/feed";

const FEED_CAP = 50;

function useTicker(ms: number) {
  const [, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/** Newest spend bundles entering the mempool. Pauses while hovered so rows stay clickable. */
export function LiveTransactions() {
  const t = useT(feedNs);
  const summary = useMempoolSummary();
  const mine = useWalletPendingIds();
  const [paused, setPaused] = useState(false);
  const frozen = useRef<typeof rows>([]);
  useTicker(10_000);
  const rows = useMemo(() => {
    const items = [...(summary.data?.items ?? [])]
      .sort((a, b) => b.firstSeen - a.firstSeen)
      .slice(0, FEED_CAP);
    return items;
  }, [summary.data]);
  if (!paused) frozen.current = rows;
  const shown = paused ? frozen.current : rows;
  const knownIds = useRef(new Set<string>());
  const fresh = new Set(shown.filter((r) => !knownIds.current.has(r.id)).map((r) => r.id));
  // Only the rows on screen matter for the "new" flash; remembering every id ever shown would
  // grow for as long as the tab stays open.
  useEffect(() => {
    knownIds.current = new Set(shown.map((r) => r.id));
  });

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            {t("latestTransactions")}
            {paused ? (
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] normal-case tracking-normal text-fg-faint">
                {t("paused")}
              </span>
            ) : null}
          </span>
        }
        action={
          <Link href={routes.mempool()} className="text-xs font-medium text-accent hover:underline">
            {t("mempoolLink")}
          </Link>
        }
      />
      <CardBody>
        <div
          className="max-h-[420px] overflow-y-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          {summary.isLoading && shown.length === 0 ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-faint">{t("empty")}</p>
          ) : (
            <ul className="divide-y divide-border/60" aria-live="polite" aria-relevant="additions">
              {shown.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-center gap-3 py-2 pl-2 text-sm",
                    fresh.has(item.id) && "animate-row-in"
                  )}
                >
                  <Hash value={item.id} href={routes.tx(item.id)} head={6} tail={4} />
                  {mine.has(item.id) ? <YoursChip /> : null}
                  <AssetBadge kind={item.kind} assetId={item.assetIds[0]} />
                  <AssetAmount
                    assets={item.assets}
                    kind={item.kind}
                    className="ml-auto hidden text-fg-muted sm:inline"
                  />
                  <span
                    className="tabular w-20 text-right text-fg-muted"
                    title={t("costTitle", { cost: formatCost(item.cost) })}
                  >
                    {BigInt(item.fee) === 0n ? (
                      <span className="text-fg-faint">{t("zeroFee")}</span>
                    ) : (
                      t("feeRate", { rate: formatFeeRate(item.feeRate) })
                    )}
                  </span>
                  <span
                    className="tabular w-14 text-right text-xs text-fg-faint"
                    title={t("firstSeenTitle")}
                  >
                    {formatAge(item.firstSeen)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function LatestBlocks() {
  const t = useT(feedNs);
  const { settings } = useSettings();
  const recent = useRecentBlocks(settings.recentBlocks);
  useTicker(10_000);
  const blocks = recent.data?.all.slice(0, 12) ?? [];
  return (
    <Card>
      <CardHeader
        title={t("latestBlocks")}
        action={
          <Link href={routes.blocks()} className="text-xs font-medium text-accent hover:underline">
            {t("blocksLink")}
          </Link>
        }
      />
      <CardBody>
        {recent.isLoading && blocks.length === 0 ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {blocks.map((b) => (
              <li key={b.height} className="flex items-center gap-3 py-2 text-sm">
                <Link
                  href={routes.block(b.height)}
                  className="tabular font-semibold text-accent hover:underline"
                >
                  {formatNumber(b.height)}
                </Link>
                {b.isTransactionBlock ? (
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {t("txBlock")}
                  </span>
                ) : (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase text-fg-faint">
                    {t("noTx")}
                  </span>
                )}
                <span className="tabular ml-auto text-fg-muted">
                  {b.isTransactionBlock ? formatAmount(b.fees ?? 0n) : "—"}
                </span>
                <span
                  className="mono hidden w-24 truncate text-xs text-fg-faint md:inline"
                  title={b.farmerPuzzleHash}
                >
                  {b.farmerPuzzleHash.slice(0, 10)}…
                </span>
                <span className="tabular w-16 text-right text-xs text-fg-faint">
                  {b.timestamp ? formatAge(b.timestamp * 1000) : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
