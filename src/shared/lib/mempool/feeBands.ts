/**
 * Fee bands (mojos per cost) used for the projected-block gradient and the mempool graph.
 * Chia fees are usually 0 while the mempool has capacity, so the first band is "0 fee"; the
 * remaining bands follow the node's fee-rate tiers (5 mojos/cost is the mempool's replace
 * threshold and the common "will be included first" rate).
 */
export interface FeeBand {
  id: string;
  label: string;
  /** Inclusive lower bound, mojos per cost. */
  min: number;
  /** CSS variable holding the band colour. */
  cssVar: string;
}

export const FEE_BANDS: FeeBand[] = [
  { id: "zero", label: "0", min: 0, cssVar: "--fee-0" },
  { id: "low", label: "0.1+", min: 0.1, cssVar: "--fee-1" },
  { id: "mid", label: "1+", min: 1, cssVar: "--fee-2" },
  { id: "high", label: "5+", min: 5, cssVar: "--fee-3" },
  { id: "very-high", label: "25+", min: 25, cssVar: "--fee-4" },
  { id: "extreme", label: "100+", min: 100, cssVar: "--fee-5" },
];

export function feeBandFor(feeRate: number): FeeBand {
  return [...FEE_BANDS].reverse().find((b) => feeRate >= b.min) ?? FEE_BANDS[0]!;
}

/** Position 0..1 of a fee rate on the gradient, log-scaled from 0.01 to 200 mojos per cost. */
export function feeRateToGradientPosition(feeRate: number): number {
  if (feeRate <= 0) return 0;
  const lo = Math.log10(0.01);
  const hi = Math.log10(200);
  const v = (Math.log10(Math.max(feeRate, 0.01)) - lo) / (hi - lo);
  return Math.min(1, Math.max(0.05, v));
}

/** CSS linear-gradient string spanning the fee bands a block covers. */
export function feeGradient(minFeeRate: number, maxFeeRate: number): string {
  const a = feeBandFor(minFeeRate).cssVar;
  const b = feeBandFor(maxFeeRate).cssVar;
  if (a === b) return `linear-gradient(160deg, var(${b}) 0%, color-mix(in srgb, var(${b}) 70%, #000) 100%)`;
  return `linear-gradient(160deg, var(${b}) 0%, var(${a}) 100%)`;
}
