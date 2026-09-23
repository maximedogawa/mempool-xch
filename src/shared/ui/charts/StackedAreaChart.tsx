"use client";

import { useId, useMemo, useState } from "react";
import { useT } from "@/shared/i18n/useT";
import { cn } from "@/shared/lib/cn";
import uiNs from "@/shared/i18n/messages/en/ui";

export interface StackedSeries {
  id: string;
  label: string;
  color: string;
}

export interface StackedPoint {
  t: number;
  values: number[];
}

/**
 * Dependency-free stacked area chart (SVG). Theme-aware through CSS variables, keyboard and
 * screen-reader friendly through a text summary and a hover/focus crosshair.
 */
export function StackedAreaChart({
  series,
  points,
  height = 220,
  formatValue,
  formatTime,
  ariaLabel,
  className,
}: {
  series: StackedSeries[];
  points: StackedPoint[];
  height?: number;
  formatValue: (v: number) => string;
  formatTime: (t: number) => string;
  ariaLabel: string;
  className?: string;
}) {
  const id = useId();
  const t = useT(uiNs);
  const [hover, setHover] = useState<number | null>(null);
  const width = 800;
  const pad = { l: 44, r: 8, t: 8, b: 22 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const model = useMemo(() => {
    if (points.length === 0) return null;
    const t0 = points[0]!.t;
    const t1 = points[points.length - 1]!.t;
    const span = Math.max(1, t1 - t0);
    const totals = points.map((p) => p.values.reduce((a, b) => a + b, 0));
    const max = Math.max(1, ...totals);
    const x = (t: number) => pad.l + ((t - t0) / span) * innerW;
    const y = (v: number) => pad.t + innerH - (v / max) * innerH;
    const stacks = series.map((_, si) =>
      points.map((p) => {
        const below = p.values.slice(0, si).reduce((a, b) => a + b, 0);
        return { x: x(p.t), y0: y(below), y1: y(below + (p.values[si] ?? 0)) };
      })
    );
    const paths = stacks.map((stack) => {
      const top = stack
        .map((s, i) => `${i === 0 ? "M" : "L"}${s.x.toFixed(1)},${s.y1.toFixed(1)}`)
        .join(" ");
      const bottom = [...stack]
        .reverse()
        .map((s) => `L${s.x.toFixed(1)},${s.y0.toFixed(1)}`)
        .join(" ");
      return `${top} ${bottom} Z`;
    });
    const ticks = [0, 0.5, 1].map((f) => ({ v: max * f, y: y(max * f) }));
    const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      t: t0 + span * f,
      x: pad.l + innerW * f,
    }));
    return { paths, ticks, timeTicks, x, totals, max };
  }, [points, series, innerH, innerW, pad.l, pad.t]);

  if (!model || points.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center text-sm text-fg-faint", className)}
        style={{ height }}
      >
        {t("chart.collecting")}
      </div>
    );
  }

  const hoverPoint = hover !== null ? points[hover] : null;
  const summary = t("chart.stackedSummary", {
    label: ariaLabel,
    count: points.length,
    from: formatTime(points[0]!.t),
    to: formatTime(points[points.length - 1]!.t),
    latest: formatValue(model.totals[model.totals.length - 1] ?? 0),
  });

  const onMove = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * width;
    const nearest = points.reduce(
      (best, p, i) =>
        Math.abs(model.x(p.t) - px) < Math.abs(model.x(points[best]!.t) - px) ? i : best,
      0
    );
    setHover(nearest);
  };

  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summary}
        className="block h-auto w-full select-none"
        onMouseMove={(e) => onMove(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => e.touches[0] && onMove(e.touches[0].clientX, e.currentTarget)}
        onTouchEnd={() => setHover(null)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? points.length) - 1));
          if (e.key === "ArrowRight") setHover((h) => Math.min(points.length - 1, (h ?? -1) + 1));
          if (e.key === "Escape") setHover(null);
        }}
      >
        <title>{summary}</title>
        {model.ticks.map((tick) => (
          <g key={tick.v}>
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={tick.y}
              y2={tick.y}
              stroke="var(--border)"
              strokeDasharray="3 3"
            />
            <text
              x={pad.l - 6}
              y={tick.y + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--fg-faint)"
            >
              {formatValue(tick.v)}
            </text>
          </g>
        ))}
        {model.timeTicks.map((tick) => (
          <text
            key={tick.t}
            x={tick.x}
            y={height - 6}
            textAnchor="middle"
            fontSize="10"
            fill="var(--fg-faint)"
          >
            {formatTime(tick.t)}
          </text>
        ))}
        {model.paths.map((d, i) => (
          <path
            key={series[i]!.id}
            d={d}
            fill={series[i]!.color}
            fillOpacity={0.85}
            stroke={series[i]!.color}
            strokeWidth={0.5}
          />
        ))}
        {hoverPoint ? (
          <line
            x1={model.x(hoverPoint.t)}
            x2={model.x(hoverPoint.t)}
            y1={pad.t}
            y2={pad.t + innerH}
            stroke="var(--fg-muted)"
            strokeWidth={1}
          />
        ) : null}
      </svg>
      {hoverPoint ? (
        <div
          id={`${id}-tip`}
          role="status"
          className="pointer-events-none absolute top-2 rounded-sm border border-border bg-bg-elevated px-2.5 py-2 text-xs shadow-card"
          style={{ left: `${Math.min(80, (model.x(hoverPoint.t) / width) * 100)}%` }}
        >
          <div className="mb-1 font-medium text-fg">{formatTime(hoverPoint.t)}</div>
          {series
            .map((s, i) => ({ s, v: hoverPoint.values[i] ?? 0 }))
            .filter((e) => e.v > 0)
            .reverse()
            .map(({ s, v }) => (
              <div key={s.id} className="flex items-center gap-1.5 text-fg-muted">
                <span
                  className="inline-block h-2 w-2 rounded-sm"
                  style={{ background: s.color }}
                  aria-hidden="true"
                />
                <span>{s.label}</span>
                <span className="tabular ml-auto pl-3 text-fg">{formatValue(v)}</span>
              </div>
            ))}
          <div className="mt-1 border-t border-border pt-1 text-fg">
            {t("chart.total", { value: formatValue(hoverPoint.values.reduce((a, b) => a + b, 0)) })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
