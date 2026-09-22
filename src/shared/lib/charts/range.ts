/** Chart range presets, shared by every chart on /charts. */
import { plainT } from "@/shared/i18n/plain";

export type RangeId = "6h" | "24h" | "7d" | "30d" | "1y" | "all";

export interface RangeDef {
  id: RangeId;
  label: string;
  /** Milliseconds of history; null for "All" (bounded separately by chain age). */
  ms: number | null;
  /** How many sample windows to spread across this range, regardless of its span. */
  windows: number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const RANGES: readonly RangeDef[] = [
  { id: "6h", label: "6h", ms: 6 * HOUR, windows: 6 },
  { id: "24h", label: "24h", ms: DAY, windows: 12 },
  { id: "7d", label: "7d", ms: 7 * DAY, windows: 14 },
  { id: "30d", label: "30d", ms: 30 * DAY, windows: 20 },
  { id: "1y", label: "1y", ms: 365 * DAY, windows: 24 },
  {
    id: "all",
    // A getter so the label follows the UI language at render time.
    get label() {
      return plainT("common")("range.all");
    },
    ms: null,
    windows: 24,
  },
];

export function rangeById(id: RangeId): RangeDef {
  return RANGES.find((r) => r.id === id) ?? RANGES[1]!;
}

/** Default heights fetched per sample window: enough transaction blocks to average sensibly. */
export const DEFAULT_SAMPLE_SIZE = 120;

/**
 * `windows` evenly-spaced [start, end) sample windows across the range, oldest first, each
 * `sampleSize` heights wide — never the whole span. A short range (6h at windows=6) still tiles
 * it fully since span/windows is already <= sampleSize; a long one ("1y", "All") samples sparse
 * points instead of covering millions of blocks, so total data fetched is bounded by
 * `windows * sampleSize` regardless of how long the range is (no server-side
 * history to sample from instead).
 */
export function heightWindows(
  peakHeight: number,
  oldestHeight: number,
  windows: number,
  sampleSize = DEFAULT_SAMPLE_SIZE
): { start: number; end: number }[] {
  const span = Math.max(0, peakHeight - oldestHeight);
  if (span === 0 || windows <= 0)
    return [{ start: Math.max(0, peakHeight - sampleSize + 1), end: peakHeight + 1 }];
  const step = Math.max(1, Math.floor(span / windows));
  const windowSize = Math.min(step, sampleSize);
  // A window this small (the last one often is, clipped against peakHeight+1) has too few
  // blocks to extrapolate a per-hour rate from without a wild swing (one block's timestamp
  // spread of ~0s would read as "3600/hour"): pull its start back to reach a minimum size
  // instead of dropping it or (worse, for sparse sampling) stretching the previous window's
  // end across the gap between them.
  const minWindow = Math.max(1, Math.floor(windowSize / 2));
  const out: { start: number; end: number }[] = [];
  for (let center = oldestHeight; center <= peakHeight; center += step) {
    const end = Math.min(peakHeight + 1, center + windowSize);
    let start = center;
    if (end - start < minWindow) start = Math.max(oldestHeight, end - minWindow);
    const prevEnd = out[out.length - 1]?.end;
    if (prevEnd !== undefined && start < prevEnd) start = prevEnd;
    if (end <= start) continue;
    out.push({ start, end });
  }
  return out;
}

/**
 * Rounds a height down to the nearest `size`, so a chart's query key stays stable across the
 * live peak advancing one block at a time (every ~18s) instead of re-fetching every window on
 * every new block — a fresh peak within the same bucket is close enough for a historical chart.
 */
export function bucketHeight(height: number, size = 50): number {
  return height - (height % size);
}

/** Oldest height to fetch for a range, given the peak and the chain's average block time. */
export function oldestHeightForRange(
  peakHeight: number,
  range: RangeDef,
  averageBlockTimeS: number
): number {
  if (range.ms === null) return 0;
  const blocks = Math.ceil(range.ms / 1000 / Math.max(1, averageBlockTimeS));
  return Math.max(0, peakHeight - blocks);
}
