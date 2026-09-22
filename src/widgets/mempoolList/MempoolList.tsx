"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMempoolSummary } from "@/shared/api/hooks";
import {
  formatAmount,
  formatCost,
  formatFeeRate,
  formatNumber,
  formatPercent,
} from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { formatAge } from "@/shared/lib/format/time";
import { routes } from "@/shared/lib/routes";
import {
  AssetAmount,
  AssetBadge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  Hash,
  Skeleton,
  StatTile,
  Table,
  Td,
  Th,
  Tr,
} from "@/shared/ui";
import { useWalletPendingIds } from "@/shared/lib/sage/usePendingIds";
import { YoursChip } from "@/shared/ui/YoursChip";
import { useT } from "@/shared/i18n/useT";
import { sortMempoolItems, type MempoolSortKey, type SortDirection } from "./sort";

const PAGE = 100;

/** Sortable columns; each key is also its label key under `columns`. */
const COLUMNS: { key: MempoolSortKey; className?: string }[] = [
  { key: "feeRate", className: "text-right" },
  { key: "fee", className: "hidden text-right sm:table-cell" },
  { key: "cost", className: "hidden text-right md:table-cell" },
  { key: "age", className: "text-right" },
];

export function MempoolList() {
  const t = useT("mempoolList");
  const mine = useWalletPendingIds();
  const summary = useMempoolSummary();
  const [sortKey, setSortKey] = useState<MempoolSortKey>("feeRate");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [limit, setLimit] = useState(PAGE);
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const data = summary.data;
  const items = useMemo(() => data?.items ?? [], [data]);
  const sorted = useMemo(
    () => sortMempoolItems(items, sortKey, direction),
    [items, sortKey, direction]
  );
  const shown = sorted.slice(0, limit);
  const state = summary.data?.state;
  const fill =
    state && state.mempoolMaxTotalCost > 0 ? state.mempoolCost / state.mempoolMaxTotalCost : 0;
  const now = Date.now();

  const toggle = (key: MempoolSortKey) => {
    if (key === sortKey) setDirection((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setDirection("desc");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile
          label={t("spendBundles")}
          value={state ? formatNumber(state.mempoolSize) : "…"}
          sub={
            state && items.length !== state.mempoolSize
              ? t("summarised", { count: formatNumber(items.length) })
              : undefined
          }
        />
        <StatTile
          label={t("costUsed")}
          value={state ? formatPercent(fill) : "…"}
          sub={
            state
              ? t("costOf", {
                  used: formatCost(state.mempoolCost),
                  max: formatCost(state.mempoolMaxTotalCost),
                })
              : undefined
          }
          tone={fill > 0.9 ? "danger" : fill > 0.6 ? "warning" : "default"}
        />
        <StatTile
          label={t("totalFees")}
          value={state ? formatAmount(BigInt(state.mempoolFees)) : "…"}
        />
        <StatTile
          label={t("updated")}
          value={summary.data ? formatAge(summary.data.generatedAt, now) : "…"}
          sub={
            summary.data
              ? summary.data.source === "server"
                ? t("source.server")
                : summary.data.source === "snapshot"
                  ? t("source.snapshot")
                  : summary.data.source === "syncing"
                    ? t("source.syncing")
                    : t("source.node")
              : undefined
          }
        />
      </div>
      <Card>
        <CardHeader
          title={t("pendingTitle")}
          action={
            <span className="text-xs text-fg-faint">
              {summary.isFetching ? t("updating") : t("live")}
            </span>
          }
        />
        <CardBody className="flex flex-col gap-3">
          {summary.error && items.length === 0 ? (
            <EmptyState
              tone="danger"
              title={t("loadError")}
              description={String((summary.error as Error).message)}
            />
          ) : summary.isLoading && items.length === 0 ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t("columns.txId")}</Th>
                  <Th>{t("columns.kind")}</Th>
                  <Th className="hidden text-right lg:table-cell">{t("columns.value")}</Th>
                  {COLUMNS.map((c) => (
                    <Th
                      key={c.key}
                      className={c.className}
                      aria-sort={
                        sortKey === c.key
                          ? direction === "desc"
                            ? "descending"
                            : "ascending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => toggle(c.key)}
                        className={cn(
                          "inline-flex items-center gap-1 uppercase hover:text-fg",
                          sortKey === c.key && "text-fg"
                        )}
                      >
                        {t(`columns.${c.key}`)}
                        {sortKey === c.key ? (
                          direction === "desc" ? (
                            <ArrowDown size={12} aria-hidden="true" />
                          ) : (
                            <ArrowUp size={12} aria-hidden="true" />
                          )
                        ) : null}
                      </button>
                    </Th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((item) => (
                  <Tr key={item.id}>
                    <Td className="whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <Hash
                          value={item.id}
                          href={routes.tx(item.id)}
                          head={6}
                          tail={4}
                          className="break-normal"
                        />
                        {mine.has(item.id) ? <YoursChip /> : null}
                      </span>
                    </Td>
                    <Td>
                      <AssetBadge kind={item.kind} assetId={item.assetIds[0]} />
                    </Td>
                    <Td className="hidden text-right text-fg-muted lg:table-cell">
                      <AssetAmount assets={item.assets} kind={item.kind} />
                    </Td>
                    <Td className="tabular text-right">
                      {BigInt(item.fee) === 0n ? (
                        <span className="text-fg-faint">0</span>
                      ) : (
                        formatFeeRate(item.feeRate)
                      )}
                    </Td>
                    <Td className="tabular hidden text-right sm:table-cell">
                      {formatAmount(BigInt(item.fee))}
                    </Td>
                    <Td className="tabular hidden text-right md:table-cell">
                      {formatCost(item.cost)}
                    </Td>
                    <Td
                      className="tabular whitespace-nowrap text-right text-fg-faint"
                      title={t("firstSeenTitle")}
                    >
                      {formatAge(item.firstSeen, now)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
          {sorted.length > shown.length ? (
            <div className="flex items-center justify-between text-xs text-fg-faint">
              <span>{t("showing", { shown: shown.length, total: sorted.length })}</span>
              <Button size="sm" onClick={() => setLimit((l) => l + PAGE)}>
                {t("showMore")}
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
