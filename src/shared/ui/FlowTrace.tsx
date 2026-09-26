import { cn } from "@/shared/lib/cn";

/**
 * The flow trace: thin layered ribbons that read as queued transactions drifting towards a
 * block, a patch of 1-bit dither and a tiny mono time marker. Purely atmospheric (hero panels,
 * empty states); it carries no data, so it is hidden from assistive technology. The ribbons are
 * drawn twice side by side so a -50% drift loops seamlessly; see `.flow-trace-band`.
 */

const W = 1200;

/** A ribbon: a filled band between two phase-shifted waves, plus its thin centre trace. */
function ribbon(y: number, amp: number, thick: number, freq: number, phase: number) {
  const steps = 48;
  const top: string[] = [];
  const bottom: string[] = [];
  const centre: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const a = (i / steps) * Math.PI * 2 * freq + phase;
    const mid = y + Math.sin(a) * amp;
    // The band thins and swells as it travels, the way density changes in the mempool.
    const half = thick * (0.55 + 0.45 * Math.sin(a * 0.5 + phase));
    top.push(`${x.toFixed(1)},${(mid - half).toFixed(1)}`);
    bottom.unshift(`${x.toFixed(1)},${(mid + half).toFixed(1)}`);
    centre.push(`${x.toFixed(1)},${mid.toFixed(1)}`);
  }
  return { area: `M${top.join("L")}L${bottom.join("L")}Z`, line: `M${centre.join("L")}` };
}

const BANDS = [
  { y: 58, amp: 16, thick: 14, freq: 2, phase: 0.4, fill: "var(--primary-pastel)", opacity: 0.34 },
  { y: 82, amp: 22, thick: 9, freq: 3, phase: 1.9, fill: "var(--aqua-stone)", opacity: 0.3 },
  { y: 104, amp: 12, thick: 6, freq: 4, phase: 3.1, fill: "var(--fog-violet)", opacity: 0.32 },
].map((b) => ({ ...b, ...ribbon(b.y, b.amp, b.thick, b.freq, b.phase) }));

export function FlowTrace({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative overflow-hidden select-none", className)}
    >
      <svg
        viewBox={`0 0 ${W} 160`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {BANDS.map((b) => (
          <g key={b.y} className="flow-trace-band">
            {[0, W].map((dx) => (
              <g key={dx} transform={`translate(${dx} 0)`}>
                <path d={b.area} fill={b.fill} fillOpacity={b.opacity} />
                <path
                  d={b.line}
                  fill="none"
                  stroke="var(--fg)"
                  strokeOpacity={0.22}
                  strokeWidth={0.8}
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            ))}
          </g>
        ))}
      </svg>
      <div className="flow-dither absolute right-[12%] top-3 h-10 w-16 opacity-70" />
      <div className="absolute right-[6%] top-1/2 flex -translate-y-1/2 items-center gap-1.5">
        <span className="relative inline-block h-5 w-5 rounded-full border border-[var(--fg)]/30">
          <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-[var(--fg)]/40" />
        </span>
        {label ? <span className="eyebrow text-[10px] text-fg-muted">{label}</span> : null}
      </div>
    </div>
  );
}
