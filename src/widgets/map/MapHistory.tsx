"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { intlTag } from "@/shared/i18n/active";
import { useT } from "@/shared/i18n/useT";
import { formatNumber, formatPercent } from "@/shared/lib/chia/amounts";
import {
  OTHER_VERSIONS,
  parseTimeSeries,
  type DashboardSnapshot,
} from "@/shared/lib/map/dashboard";
import { historyPoints, versionHistoryPoints } from "@/shared/lib/map/stats";
import { Card, CardBody, CardHeader, Skeleton, Table, Td, Th, Tr } from "@/shared/ui";
import { LineChart } from "@/shared/ui/charts/LineChart";
import { StackedAreaChart } from "@/shared/ui/charts/StackedAreaChart";
import mapNs from "@/shared/i18n/messages/en/map";

const SERIES = ["total", "capacity", "ipv4", "ipv6"] as const;
type SeriesId = (typeof SERIES)[number];

/** One colour per version band; "other" takes the neutral one. */
const VERSION_COLORS = [
  "var(--region-europe)",
  "var(--region-north-america)",
  "var(--region-asia)",
  "var(--region-south-america)",
  "var(--region-africa)",
  "var(--region-oceania)",
];
const OTHER_COLOR = "var(--region-unmapped)";

const formatDay = (t: number) =>
  new Date(t).toLocaleDateString(intlTag(), { day: "2-digit", month: "short", year: "2-digit" });

/**
 * The Peer Info dashboard's time series (population, reliable, IPv4, IPv6 and the version
 * history) and its ASN table. Rendered only while the page shows the snapshot; the seeder-scan
 * fallback has no history. The series are their own file, loaded after the map has drawn, so
 * the page's first script stays the size of the current panels.
 */
export function MapHistory({ snapshot }: { snapshot: DashboardSnapshot }) {
  const t = useT(mapNs);
  const [series, setSeries] = useState<SeriesId>("total");
  const loaded = useQuery({
    queryKey: ["map", "dashboardHistory", snapshot.observedAt],
    queryFn: async () =>
      parseTimeSeries((await import("@/shared/lib/map/dashboardHistory.json")).default),
    staleTime: Infinity,
    gcTime: 0,
  });
  const timeSeries = loaded.data ?? null;
  const points = useMemo(
    () => historyPoints(timeSeries?.history ?? null, series),
    [timeSeries, series]
  );
  const versions = useMemo(
    () => versionHistoryPoints(timeSeries?.versionHistory ?? null),
    [timeSeries]
  );
  const stacked = useMemo(
    () =>
      versions.labels.map((label, index) => ({
        id: label,
        label: label === OTHER_VERSIONS ? t("history.otherVersions") : label,
        color:
          label === OTHER_VERSIONS
            ? OTHER_COLOR
            : (VERSION_COLORS[index % VERSION_COLORS.length] ?? OTHER_COLOR),
      })),
    [versions, t]
  );
  const asns = snapshot.asns;

  return (
    <>
      {loaded.isPending ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : points.length > 1 || versions.points.length > 1 ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader
              title={t("history.title")}
              action={<span className="text-xs text-fg-faint">{t("history.action")}</span>}
            />
            <CardBody className="flex flex-col gap-3">
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label={t("history.seriesLabel")}
              >
                {SERIES.map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={series === id}
                    className={`map-toggle ${series === id ? "map-toggle-active" : ""}`}
                    onClick={() => setSeries(id)}
                  >
                    {t(`history.${id}`)}
                  </button>
                ))}
              </div>
              <LineChart
                points={points}
                formatValue={(v) => formatNumber(Math.round(v))}
                formatTime={formatDay}
                ariaLabel={t("history.chartLabel", { series: t(`history.${series}`) })}
              />
              <p className="text-xs text-fg-faint">{t("history.note")}</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={t("history.versionsTitle")}
              action={<span className="text-xs text-fg-faint">{t("history.versionsAction")}</span>}
            />
            <CardBody className="flex flex-col gap-3">
              <StackedAreaChart
                series={stacked}
                points={versions.points}
                formatValue={(v) => formatNumber(Math.round(v))}
                formatTime={formatDay}
                ariaLabel={t("history.versionsLabel")}
              />
              <ul
                className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-fg-faint"
                aria-label={t("history.versionsLegend")}
              >
                {stacked.map((item) => (
                  <li key={item.id} className="inline-flex items-center gap-1">
                    <span
                      className="inline-block h-2 w-2 rounded-sm"
                      style={{ background: item.color }}
                      aria-hidden="true"
                    />
                    <span className="mono">{item.label}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {asns ? (
        <Card>
          <CardHeader
            title={t("asns.title")}
            action={
              <span className="text-xs text-fg-faint">
                {t("asns.action", { count: asns.count })}
              </span>
            }
          />
          <CardBody className="flex flex-col gap-3">
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label={t("asns.tableLabel")}
            >
              <Table>
                <thead>
                  <tr>
                    <Th className="text-right">#</Th>
                    <Th>{t("asns.organization")}</Th>
                    <Th className="hidden sm:table-cell">{t("asns.asn")}</Th>
                    <Th className="text-right">{t("asns.nodes")}</Th>
                    <Th className="text-right">{t("asns.share")}</Th>
                  </tr>
                </thead>
                <tbody>
                  {asns.top.map((row, index) => (
                    <Tr key={row.asn}>
                      <Td className="tabular text-right text-xs text-fg-faint">{index + 1}</Td>
                      <Td className="max-w-[18rem] truncate">{row.organization || "—"}</Td>
                      <Td className="mono hidden text-xs text-fg-muted sm:table-cell">
                        AS{row.asn}
                      </Td>
                      <Td className="tabular text-right">{formatNumber(row.nodes)}</Td>
                      <Td className="tabular text-right text-xs text-fg-muted">
                        {formatPercent(asns.nodes > 0 ? row.nodes / asns.nodes : 0, 1)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
            <p className="text-xs text-fg-faint">
              {t("asns.note", {
                shown: asns.top.length,
                count: asns.count,
                share: formatPercent(
                  asns.nodes > 0
                    ? asns.top.reduce((sum, row) => sum + row.nodes, 0) / asns.nodes
                    : 0,
                  1
                ),
              })}
            </p>
          </CardBody>
        </Card>
      ) : null}
    </>
  );
}
