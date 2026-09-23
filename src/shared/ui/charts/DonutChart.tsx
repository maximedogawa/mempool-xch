"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  /** CSS colour, normally a theme variable such as `var(--alloc-1)`. */
  color: string;
  /** Second line under the label in the legend and in the centre on hover (value, share). */
  detail: string;
  share: number;
}

const SIZE = 200;
const R = 88;
const WIDTH = 24;
const C = SIZE / 2;

function point(angle: number, radius: number): [number, number] {
  return [C + radius * Math.cos(angle), C + radius * Math.sin(angle)];
}

/** One ring segment between two angles (radians, 0 at 12 o'clock, clockwise). */
function arcPath(start: number, end: number): string {
  const a0 = start - Math.PI / 2;
  const a1 = end - Math.PI / 2;
  const outer = R;
  const inner = R - WIDTH;
  const large = end - start > Math.PI ? 1 : 0;
  const [x0, y0] = point(a0, outer);
  const [x1, y1] = point(a1, outer);
  const [x2, y2] = point(a1, inner);
  const [x3, y3] = point(a0, inner);
  return [
    `M${x0} ${y0}`,
    `A${outer} ${outer} 0 ${large} 1 ${x1} ${y1}`,
    `L${x2} ${y2}`,
    `A${inner} ${inner} 0 ${large} 0 ${x3} ${y3}`,
    "Z",
  ].join(" ");
}

/**
 * Part-to-whole donut (SVG, no dependencies) with its legend. Segments are separated by a 2px
 * surface gap; hovering or focusing a segment or its legend entry shows that slice in the
 * centre, otherwise the centre shows `center` (the total). The legend names every slice, so
 * identity never rests on colour alone.
 */
export function DonutChart({
  slices,
  center,
  ariaLabel,
  className,
}: {
  slices: DonutSlice[];
  center: ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let angle = 0;
  const arcs = slices.map((s) => {
    const sweep = total > 0 ? (s.value / total) * Math.PI * 2 : 0;
    const arc = { slice: s, start: angle, end: angle + sweep };
    angle += sweep;
    return arc;
  });
  const focused = slices.find((s) => s.key === active) ?? null;

  return (
    <div
      className={cn("flex flex-col items-center gap-5 sm:flex-row sm:items-center", className)}
      onMouseLeave={() => setActive(null)}
    >
      <div className="relative w-full max-w-[220px] shrink-0">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={ariaLabel} className="w-full">
          {arcs.map(({ slice, start, end }) =>
            end - start >= Math.PI * 2 - 1e-9 ? (
              <circle
                key={slice.key}
                cx={C}
                cy={C}
                r={R - WIDTH / 2}
                fill="none"
                stroke={slice.color}
                strokeWidth={WIDTH}
                onMouseEnter={() => setActive(slice.key)}
              />
            ) : (
              <path
                key={slice.key}
                d={arcPath(start, end)}
                fill={slice.color}
                stroke="var(--surface)"
                strokeWidth={2}
                strokeLinejoin="round"
                opacity={active && active !== slice.key ? 0.45 : 1}
                className="transition-opacity"
                onMouseEnter={() => setActive(slice.key)}
              />
            )
          )}
        </svg>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center"
          aria-live="polite"
        >
          {focused ? (
            <>
              <span className="max-w-full truncate text-xs text-fg-muted">{focused.label}</span>
              <span className="tabular text-sm font-semibold text-fg">{focused.detail}</span>
            </>
          ) : (
            center
          )}
        </div>
      </div>
      <ul className="flex w-full min-w-0 flex-col gap-1">
        {slices.map((s) => (
          <li key={s.key}>
            <button
              type="button"
              onMouseEnter={() => setActive(s.key)}
              onFocus={() => setActive(s.key)}
              onBlur={() => setActive(null)}
              className={cn(
                "flex w-full min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-2 focus-visible:bg-surface-2",
                active === s.key && "bg-surface-2"
              )}
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="min-w-0 flex-1 truncate text-fg">{s.label}</span>
              <span className="tabular shrink-0 text-xs text-fg-muted">{s.detail}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
