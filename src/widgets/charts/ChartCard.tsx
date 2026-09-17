"use client";

import { useMemo } from "react";
import { smoothingById, smoothSeries, type SmoothingId, type Point } from "@/shared/lib/charts/smoothing";
import { Card, CardBody, CardHeader, Skeleton, StatTile } from "@/shared/ui";
import { LineChart } from "@/shared/ui/charts/LineChart";
import type { ScaleId } from "./ChartControls";

export interface ChartSpec {
  title: string;
  /** What the chart shows, in plain language. */
  definition: string;
  /** Where the numbers come from and how they are computed. */
  technical: string;
  formatValue: (v: number) => string;
  formatTime: (t: number) => string;
}

function summarise(points: Point[]) {
  if (points.length === 0) return null;
  const values = points.map((p) => p.v);
  return {
    latest: values[values.length - 1]!,
    average: values.reduce((a, b) => a + b, 0) / values.length,
    highest: Math.max(...values),
    count: points.length,
  };
}

export function ChartCard({
  spec,
  points,
  loading,
  unavailable,
  smoothing,
  scale,
}: {
  spec: ChartSpec;
  points: Point[] | null;
  loading?: boolean;
  /** A note explaining why this series is not shown, instead of the chart. */
  unavailable?: string;
  smoothing: SmoothingId;
  scale: ScaleId;
}) {
  const smoothed = useMemo(() => (points ? smoothSeries(points, smoothingById(smoothing).window) : null), [points, smoothing]);
  const stats = smoothed ? summarise(smoothed) : null;
  return (
    <Card className={unavailable ? "opacity-70" : undefined}>
      <CardHeader title={spec.title} />
      <CardBody className="flex flex-col gap-3">
        {unavailable ? (
          <div role="note" className="rounded-sm border border-dashed border-border px-3 py-8 text-center text-sm text-fg-faint">
            {unavailable}
          </div>
        ) : loading ? (
          <Skeleton className="h-[200px]" />
        ) : smoothed && smoothed.length >= 2 ? (
          <>
            <LineChart points={smoothed} scale={scale} formatValue={spec.formatValue} formatTime={spec.formatTime} ariaLabel={spec.title} />
            {stats ? (
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <StatTile label="Latest" value={spec.formatValue(stats.latest)} />
                <StatTile label="Average" value={spec.formatValue(stats.average)} />
                <StatTile label="Highest" value={spec.formatValue(stats.highest)} />
                <StatTile label="Points" value={String(stats.count)} />
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-sm text-fg-faint">Not enough data yet.</div>
        )}
        <details className="text-xs text-fg-faint">
          <summary className="cursor-pointer select-none font-medium text-fg-muted">Definition &amp; technical note</summary>
          <p className="mt-1">{spec.definition}</p>
          <p className="mt-1">{spec.technical}</p>
        </details>
      </CardBody>
    </Card>
  );
}
