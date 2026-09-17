"use client";

import { useId, useMemo, useState } from "react";
import { cn } from "@/shared/lib/cn";
import type { Point } from "@/shared/lib/charts/smoothing";

/**
 * Dependency-free single-series line chart (SVG), following StackedAreaChart's accessibility
 * pattern: a text summary, a hover/focus crosshair with arrow-key navigation, theme via CSS vars.
 */
export function LineChart({
  points,
  scale = "linear",
  height = 200,
  color = "var(--primary)",
  formatValue,
  formatTime,
  ariaLabel,
  className,
}: {
  points: Point[];
  scale?: "linear" | "log";
  height?: number;
  color?: string;
  formatValue: (v: number) => string;
  formatTime: (t: number) => string;
  ariaLabel: string;
  className?: string;
}) {
  const id = useId();
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
    const values = points.map((p) => p.v);
    const maxV = Math.max(...values);
    const minV = scale === "log" ? Math.min(...values.filter((v) => v > 0), maxV || 1) : Math.min(0, ...values);
    // Log scale needs a positive floor; values <= 0 are drawn at that floor rather than lost.
    const floor = scale === "log" ? Math.max(minV * 0.5, maxV > 0 ? maxV / 1000 : 1) : 0;
    const toY = (v: number) => (scale === "log" ? Math.log(Math.max(v, floor)) : v);
    const yMax = toY(maxV || 1);
    const yMin = scale === "log" ? toY(floor) : Math.min(0, minV);
    const ySpan = Math.max(1e-9, yMax - yMin);
    const x = (t: number) => pad.l + ((t - t0) / span) * innerW;
    const y = (v: number) => pad.t + innerH - ((toY(v) - yMin) / ySpan) * innerH;
    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(" ");
    const areaPath = `${linePath} L${x(points[points.length - 1]!.t).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${x(t0).toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;
    const tickCount = 4;
    const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
      const v = scale === "log" ? Math.exp(yMin + (ySpan * i) / tickCount) : minV + ((maxV - minV) * i) / tickCount;
      return { v, y: y(v) };
    });
    const timeTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ t: t0 + span * f, x: pad.l + innerW * f }));
    return { x, y, linePath, areaPath, ticks, timeTicks, maxV, minV, latest: values[values.length - 1]! };
  }, [points, scale, innerH, innerW, pad.l, pad.t]);

  if (!model || points.length < 2) {
    return (
      <div className={cn("flex items-center justify-center text-sm text-fg-faint", className)} style={{ height }}>
        Not enough data yet.
      </div>
    );
  }

  const hoverPoint = hover !== null ? points[hover] : null;
  const summary = `${ariaLabel}. ${points.length} points from ${formatTime(points[0]!.t)} to ${formatTime(points[points.length - 1]!.t)}. Latest ${formatValue(model.latest)}.`;

  const onMove = (clientX: number, target: SVGSVGElement) => {
    const rect = target.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * width;
    const nearest = points.reduce((best, p, i) => (Math.abs(model.x(p.t) - px) < Math.abs(model.x(points[best]!.t) - px) ? i : best), 0);
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
        {model.ticks.map((tick, i) => (
          <g key={i}>
            <line x1={pad.l} x2={width - pad.r} y1={tick.y} y2={tick.y} stroke="var(--border)" strokeDasharray="3 3" />
            <text x={pad.l - 6} y={tick.y + 4} textAnchor="end" fontSize="10" fill="var(--fg-faint)">
              {formatValue(tick.v)}
            </text>
          </g>
        ))}
        {model.timeTicks.map((tick) => (
          <text key={tick.t} x={tick.x} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--fg-faint)">
            {formatTime(tick.t)}
          </text>
        ))}
        <path d={model.areaPath} fill={color} fillOpacity={0.12} stroke="none" />
        <path d={model.linePath} fill="none" stroke={color} strokeWidth={1.5} />
        {hoverPoint ? (
          <>
            <line x1={model.x(hoverPoint.t)} x2={model.x(hoverPoint.t)} y1={pad.t} y2={pad.t + innerH} stroke="var(--fg-muted)" strokeWidth={1} />
            <circle cx={model.x(hoverPoint.t)} cy={model.y(hoverPoint.v)} r={3} fill={color} />
          </>
        ) : null}
      </svg>
      {hoverPoint ? (
        <div
          id={`${id}-tip`}
          role="status"
          className="pointer-events-none absolute top-2 rounded-sm border border-border bg-bg-elevated px-2.5 py-2 text-xs shadow-card"
          style={{ left: `${Math.min(80, (model.x(hoverPoint.t) / width) * 100)}%` }}
        >
          <div className="font-medium text-fg">{formatTime(hoverPoint.t)}</div>
          <div className="tabular text-fg-muted">{formatValue(hoverPoint.v)}</div>
        </div>
      ) : null}
    </div>
  );
}
