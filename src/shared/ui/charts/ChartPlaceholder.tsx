import { cn } from "@/shared/lib/cn";

/** A soft, made-up curve: reads as "a chart goes here", never as data. */
function wave(width: number, height: number, pad: { l: number; r: number; t: number; b: number }) {
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const base = pad.t + innerH;
  const steps = 48;
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const f = i / steps;
    const y = 0.45 + 0.12 * Math.sin(f * Math.PI * 2.2 + 0.6) + 0.06 * Math.sin(f * Math.PI * 7.1);
    return `${(pad.l + f * innerW).toFixed(1)},${(base - y * innerH).toFixed(1)}`;
  });
  return `M${pad.l},${base} L${points.join(" L")} L${pad.l + innerW},${base} Z`;
}

/**
 * What a chart shows before it has data: its frame (grid and baseline) with a pulsing,
 * obviously generic shape and one line of text, at the chart's own size so that nothing moves
 * when the data arrives.
 */
export function ChartPlaceholder({
  label,
  height = 220,
  width = 800,
  className,
}: {
  label: string;
  height?: number;
  width?: number;
  className?: string;
}) {
  const pad = { l: 44, r: 8, t: 8, b: 22 };
  const innerH = height - pad.t - pad.b;
  return (
    <div className={cn("relative", className)} role="status">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block h-auto w-full">
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={pad.l}
            x2={width - pad.r}
            y1={pad.t + innerH * f}
            y2={pad.t + innerH * f}
            stroke="var(--border)"
            strokeDasharray={f === 1 ? undefined : "3 3"}
          />
        ))}
        <path d={wave(width, height, pad)} fill="var(--surface-2)" className="animate-pulse" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <span className="rounded-sm border border-border bg-bg/85 px-2.5 py-1 text-center text-xs text-fg-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
