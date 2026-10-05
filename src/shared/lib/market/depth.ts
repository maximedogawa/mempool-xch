/**
 * Geometry for the battlefield depth chart: cumulative XCH on a fixed price grid either side of
 * the mid, so two snapshots can be tweened point by point. Prices become numbers here on purpose:
 * this is the pixel edge; every value shown as text stays fixed point.
 */
import { divRound, toNumber } from "./decimal";
import type { MarketLevel } from "./orderbook";

export interface DepthWindow {
  mid: bigint;
  low: bigint;
  high: bigint;
}

/** Half width of the window: 2 % of the mid, widened when the spread itself is wider. */
export const WINDOW_PPM = 20_000n;

export function depthWindow(bid: bigint | null, ask: bigint | null): DepthWindow | null {
  if (bid === null || ask === null || bid <= 0n || ask <= 0n) return null;
  const mid = divRound(bid + ask, 2n);
  const gap = ask > bid ? ask - bid : bid - ask;
  let half = divRound(mid * WINDOW_PPM, 1_000_000n);
  if (gap > half) half = gap;
  return { mid, low: mid - half > 0n ? mid - half : 1n, high: mid + half };
}

/**
 * Keep the previous window while the best bid and ask stay in its inner half, so the axis holds
 * still and the front line visibly moves across it; recentre once either drifts further out.
 */
export function stickyWindow(
  previous: DepthWindow | null,
  bid: bigint | null,
  ask: bigint | null
): DepthWindow | null {
  const next = depthWindow(bid, ask);
  if (!previous || !next || bid === null || ask === null) return next;
  const inner = (previous.high - previous.low) / 4n;
  const inside = (p: bigint) => p >= previous.mid - inner && p <= previous.mid + inner;
  return inside(bid) && inside(ask) ? previous : next;
}

/** Grid points per side. */
export const DEPTH_POINTS = 72;

/** Price of grid point `i` on a side: 0 is the mid, the last point the window edge. */
export function gridPrice(
  window: DepthWindow,
  side: "bids" | "asks",
  i: number,
  points = DEPTH_POINTS
): number {
  const mid = toNumber(window.mid);
  const edge = toNumber(side === "bids" ? window.low : window.high);
  return mid + ((edge - mid) * i) / (points - 1);
}

/**
 * Cumulative amount resting at or better than each grid price. Bids count levels priced at or
 * above the point, asks at or below. Past the book's deepest level the depth is unknown: NaN.
 */
export function depthSeries(
  levels: MarketLevel[],
  side: "bids" | "asks",
  window: DepthWindow,
  points = DEPTH_POINTS
): number[] {
  const prices = levels.map((l) => toNumber(l.priceScaled));
  const out: number[] = [];
  let cursor = 0;
  let total = 0;
  // The first grid point past the deepest level still shows the full book (the last step);
  // every point after that is unknown territory.
  let exhausted = prices.length === 0;
  for (let i = 0; i < points; i++) {
    if (exhausted) {
      out.push(Number.NaN);
      continue;
    }
    const x = gridPrice(window, side, i, points);
    while (
      cursor < prices.length &&
      (side === "bids" ? prices[cursor]! >= x : prices[cursor]! <= x)
    ) {
      total += levels[cursor]!.amount;
      cursor++;
    }
    out.push(total);
    if (cursor >= prices.length) exhausted = true;
  }
  return out;
}

/**
 * Sum of several series. A book whose depth ends inside the window keeps contributing its total,
 * so the aggregate past that point is a lower bound rather than a gap.
 */
export function sumSeries(series: number[][], points = DEPTH_POINTS): number[] {
  const out = new Array<number>(points).fill(0);
  let any = false;
  for (const s of series) {
    let last = 0;
    for (let i = 0; i < points; i++) {
      const v = s[i];
      if (v !== undefined && Number.isFinite(v)) last = v;
      out[i]! += last;
      any = true;
    }
  }
  return any ? out : out.map(() => Number.NaN);
}

/** Linear interpolation of two series; a missing value on either end snaps to the target. */
export function lerpSeries(from: number[] | undefined, to: number[], t: number): number[] {
  if (!from || from.length !== to.length || t >= 1) return to;
  return to.map((v, i) => {
    const a = from[i]!;
    return Number.isFinite(a) && Number.isFinite(v) ? a + (v - a) * t : v;
  });
}

export function easeOut(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - (1 - c) ** 3;
}

/** Step line through the finite points, split where the depth is unknown. */
export function linePath(
  values: number[],
  x: (i: number) => number,
  y: (v: number) => number
): string {
  let d = "";
  let open = false;
  let lastY = 0;
  values.forEach((v, i) => {
    if (!Number.isFinite(v)) {
      open = false;
      return;
    }
    const px = x(i).toFixed(1);
    const py = y(v).toFixed(1);
    if (!open) d += `M${px},${py}`;
    else d += `L${px},${lastY.toFixed(1)}L${px},${py}`;
    lastY = y(v);
    open = true;
  });
  return d;
}

/** Closed area under the first finite run, down to `baseline`. */
export function areaPath(
  values: number[],
  x: (i: number) => number,
  y: (v: number) => number,
  baseline: number
): string {
  const line = linePath(values, x, y);
  if (!line) return "";
  const firstRun = line.split("M")[1]!;
  let end = values.findIndex((v) => !Number.isFinite(v));
  if (end === -1) end = values.length;
  const startX = x(0).toFixed(1);
  const endX = x(end - 1).toFixed(1);
  return `M${startX},${baseline.toFixed(1)}L${firstRun}L${endX},${baseline.toFixed(1)}Z`;
}
