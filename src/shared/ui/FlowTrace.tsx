import { cn } from "@/shared/lib/cn";

/**
 * The flow trace: technical linework for the one visual anchor on a page (hero panels, empty
 * states). Queue lanes converge on a cropped orbital arc, the block; queued particles pack
 * tighter as they near it, the way pressure builds in the mempool. One lane is drawn in the
 * identity cyan. Static on purpose (doc-001 v2: no decorative looping in work areas) and purely
 * atmospheric, so it is hidden from assistive technology.
 */

const W = 1200;
const H = 160;
const CX = W + 40; // the block's orbit is centred just off the right edge, so only an arc shows
const CY = H / 2;
const R = 150;
const LANES = 7;

/** A lane: leaves the left edge at its own height and bends into the arc's rim. */
function lane(i: number) {
  const y0 = 14 + (i / (LANES - 1)) * (H - 28);
  const y1 = CY + (y0 - CY) * 0.28;
  const x1 = CX - R + 6;
  const path = `M0,${y0.toFixed(1)} C${(W * 0.45).toFixed(1)},${y0.toFixed(1)} ${(W * 0.62).toFixed(1)},${y1.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}`;
  // Particles along the lane, spaced ever closer towards the block.
  const dots: { x: number; y: number }[] = [];
  let t = 0.04 + (i % 3) * 0.02;
  while (t < 0.97) {
    const u = 1 - t;
    const x = 3 * u * u * t * (W * 0.45) + 3 * u * t * t * (W * 0.62) + t * t * t * x1;
    const y = u * u * u * y0 + 3 * u * u * t * y0 + 3 * u * t * t * y1 + t * t * t * y1;
    dots.push({ x, y });
    t += 0.075 * (1 - t) + 0.012;
  }
  return { path, dots };
}

const LANE_DATA = Array.from({ length: LANES }, (_, i) => lane(i));
const ACCENT_LANE = 4;

export function FlowTrace({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none relative overflow-hidden select-none", className)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMaxYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <g fill="none" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          <circle cx={CX} cy={CY} r={R} stroke="var(--fg)" strokeOpacity={0.22} />
          <circle
            cx={CX}
            cy={CY}
            r={R + 18}
            stroke="var(--fg)"
            strokeOpacity={0.14}
            strokeDasharray="2 7"
          />
          {Array.from({ length: 13 }, (_, k) => {
            const a = Math.PI * (0.62 + (k / 12) * 0.76);
            const r0 = R + 26;
            const r1 = R + (k % 3 === 0 ? 38 : 32);
            return (
              <line
                key={k}
                x1={CX + Math.cos(a) * r0}
                y1={CY + Math.sin(a) * r0}
                x2={CX + Math.cos(a) * r1}
                y2={CY + Math.sin(a) * r1}
                stroke="var(--fg)"
                strokeOpacity={0.24}
              />
            );
          })}
          {LANE_DATA.map((l, i) => (
            <path
              key={i}
              d={l.path}
              stroke={i === ACCENT_LANE ? "var(--cta)" : "var(--fg)"}
              strokeOpacity={i === ACCENT_LANE ? 0.75 : 0.16}
              strokeWidth={i === ACCENT_LANE ? 1.2 : 0.8}
            />
          ))}
        </g>
        {LANE_DATA.map((l, i) =>
          l.dots.map((d, k) => (
            <rect
              key={`${i}-${k}`}
              x={d.x - 1.5}
              y={d.y - 1.5}
              width={3}
              height={3}
              fill={i === ACCENT_LANE ? "var(--cta)" : "var(--fg)"}
              fillOpacity={i === ACCENT_LANE ? 0.8 : 0.3}
            />
          ))
        )}
      </svg>
      <div className="flow-dither absolute right-[18%] top-2 h-8 w-14 opacity-60" />
    </div>
  );
}
