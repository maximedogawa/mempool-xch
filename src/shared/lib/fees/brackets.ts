/**
 * Fee-rate brackets for the /fees page distribution, parity with xchmempool.com's
 * table: 0 kept separate from the rest (Chia fees are usually 0 while the mempool has room),
 * then 0-1, 1-3, 3-5, 5-10, 10-25, 25-50, 50+ mojo/cost. Distinct from FEE_BANDS
 * (src/shared/lib/mempool/feeBands.ts), which are a different, coarser set used for the
 * dashboard graph and treemap gradient.
 */
export interface RateBracket {
  id: string;
  label: string;
  /** Inclusive lower bound, mojos per cost; exclusive upper bound is the next bracket's min. */
  min: number;
  max: number | null;
}

export const RATE_BRACKETS: readonly RateBracket[] = [
  { id: "zero", label: "0", min: 0, max: 0 },
  { id: "0-1", label: "0-1", min: 0, max: 1 },
  { id: "1-3", label: "1-3", min: 1, max: 3 },
  { id: "3-5", label: "3-5", min: 3, max: 5 },
  { id: "5-10", label: "5-10", min: 5, max: 10 },
  { id: "10-25", label: "10-25", min: 10, max: 25 },
  { id: "25-50", label: "25-50", min: 25, max: 50 },
  { id: "50+", label: "50+", min: 50, max: null },
];

export function bracketFor(feeRate: number): RateBracket {
  if (feeRate <= 0) return RATE_BRACKETS[0]!;
  for (let i = RATE_BRACKETS.length - 1; i >= 1; i -= 1) {
    const b = RATE_BRACKETS[i]!;
    if (feeRate >= b.min) return b;
  }
  return RATE_BRACKETS[1]!;
}

export interface BracketCount {
  bracket: RateBracket;
  count: number;
  /** Total CLVM cost of items in this bracket. */
  cost: number;
}

/** One row per RATE_BRACKETS entry, in order, zero-filled for empty brackets. */
export function bracketDistribution(
  items: readonly { feeRate: number; cost: number }[]
): BracketCount[] {
  const rows = RATE_BRACKETS.map((bracket) => ({ bracket, count: 0, cost: 0 }));
  for (const item of items) {
    const row = rows[RATE_BRACKETS.indexOf(bracketFor(item.feeRate))]!;
    row.count += 1;
    row.cost += item.cost;
  }
  return rows;
}
