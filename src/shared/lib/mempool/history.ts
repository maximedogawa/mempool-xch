/**
 * Rolling mempool history sampled in the browser: Coinset has no history endpoint,
 * so each summary refresh contributes one sample (cost per fee band, item count, fees). The
 * window survives reloads via localStorage, bounded in size and age.
 */
import { FEE_BANDS, feeBandFor } from "./feeBands";
import type { MempoolSummary } from "./types";

export interface MempoolSample {
  /** Unix ms. */
  t: number;
  /** Cost per fee band, aligned with FEE_BANDS. */
  bands: number[];
  count: number;
  /** Total fees in mojos, as a number (display only). */
  fees: number;
}

export const HISTORY_KEY_PREFIX = "mempool-xch:history:v1:";
export const MAX_SAMPLES = 1_500;
export const DEFAULT_WINDOW_MS = 2 * 60 * 60 * 1000;
/** Do not store two samples closer than this. */
export const MIN_SAMPLE_GAP_MS = 8_000;

export function sampleFromSummary(summary: MempoolSummary, t = summary.generatedAt || Date.now()): MempoolSample {
  const bands = FEE_BANDS.map(() => 0);
  summary.items.forEach((item) => {
    const idx = FEE_BANDS.indexOf(feeBandFor(item.feeRate));
    bands[idx] = (bands[idx] ?? 0) + item.cost;
  });
  return { t, bands, count: summary.items.length, fees: Number(summary.state.mempoolFees) };
}

export function appendSample(history: MempoolSample[], sample: MempoolSample, windowMs = DEFAULT_WINDOW_MS): MempoolSample[] {
  const last = history[history.length - 1];
  if (last && sample.t - last.t < MIN_SAMPLE_GAP_MS) return history;
  const cutoff = sample.t - windowMs;
  const next = [...history.filter((s) => s.t >= cutoff), sample];
  return next.length > MAX_SAMPLES ? next.slice(next.length - MAX_SAMPLES) : next;
}

export function loadHistory(storage: Pick<Storage, "getItem"> | null, network: string): MempoolSample[] {
  try {
    const raw = storage?.getItem(`${HISTORY_KEY_PREFIX}${network}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is MempoolSample =>
        !!s && typeof s === "object" && typeof (s as MempoolSample).t === "number" && Array.isArray((s as MempoolSample).bands)
    );
  } catch {
    return [];
  }
}

export function saveHistory(storage: Pick<Storage, "setItem"> | null, network: string, history: MempoolSample[]): void {
  try {
    storage?.setItem(`${HISTORY_KEY_PREFIX}${network}`, JSON.stringify(history));
  } catch {
    // Quota or private mode: history stays in memory only.
  }
}
