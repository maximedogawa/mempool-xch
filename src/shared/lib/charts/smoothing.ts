/** Smoothing control for chart series: a centred moving average over neighbouring points. */
import { plainT } from "@/shared/i18n/plain";

export type SmoothingId = "raw" | "smooth" | "very-smooth";

export const SMOOTHING_LEVELS: readonly { id: SmoothingId; label: string; window: number }[] = [
  // Getters so the labels follow the UI language at render time.
  {
    id: "raw",
    get label() {
      return plainT("common")("smoothing.raw");
    },
    window: 1,
  },
  {
    id: "smooth",
    get label() {
      return plainT("common")("smoothing.smooth");
    },
    window: 3,
  },
  {
    id: "very-smooth",
    get label() {
      return plainT("common")("smoothing.verySmooth");
    },
    window: 7,
  },
];

export function smoothingById(id: SmoothingId) {
  return SMOOTHING_LEVELS.find((s) => s.id === id) ?? SMOOTHING_LEVELS[0]!;
}

export interface Point {
  t: number;
  v: number;
}

/** Centred moving average, window points wide (clamped at the ends); t is left untouched. */
export function smoothSeries(points: readonly Point[], window: number): Point[] {
  if (window <= 1 || points.length < 3) return points.slice();
  const half = Math.floor(window / 2);
  return points.map((p, i) => {
    const lo = Math.max(0, i - half);
    const hi = Math.min(points.length - 1, i + half);
    let sum = 0;
    for (let j = lo; j <= hi; j += 1) sum += points[j]!.v;
    return { t: p.t, v: sum / (hi - lo + 1) };
  });
}
