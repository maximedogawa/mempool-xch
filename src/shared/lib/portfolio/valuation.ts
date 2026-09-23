/**
 * Portfolio valuation: what holdings are worth and how they split. Amounts arrive as bigint
 * mojos; values are display figures from third-party prices (Dexie in XCH, Gate.io for USD),
 * hence plain numbers from here on. A CAT without a price is worth "unknown", never zero: it
 * stays in the holdings list but out of every total and out of the allocation.
 */
import type { TokenMarketMap } from "@/shared/lib/tokens/markets";

export interface Holding {
  kind: "xch" | "cat";
  /** CAT asset id (hex, no 0x); null for XCH. */
  assetId: string | null;
  amount: bigint;
  /** Decimal places of one unit: 12 for XCH, 3 for a standard CAT. */
  precision: number;
  name?: string | null;
  ticker?: string | null;
  iconUrl?: string | null;
}

export interface ValuedHolding extends Holding {
  key: string;
  units: number;
  /** Price of one unit in XCH (1 for XCH itself); null when nobody quotes it. */
  priceXch: number | null;
  valueXch: number | null;
  valueUsd: number | null;
  /** Share of the priced total, 0..1; null when unpriced or the total is zero. */
  share: number | null;
}

export interface PortfolioSummary {
  /** Priced holdings by value (largest first), then unpriced ones by amount. */
  rows: ValuedHolding[];
  totalXch: number;
  totalUsd: number | null;
  /**
   * USD the portfolio gained or lost over 24 hours through XCH's own move. Token prices are
   * quoted in XCH, so they move with it; their own 24-hour change is not known.
   */
  change24hUsd: number | null;
  change24h: number | null;
  assetCount: number;
  largest: ValuedHolding | null;
  unpricedCount: number;
}

export function holdingKey(h: Pick<Holding, "kind" | "assetId">): string {
  return h.kind === "xch" ? "xch" : `cat:${h.assetId ?? "?"}`;
}

/** bigint base units to a float without losing the whole part above 2^53 mojos. */
export function unitsOf(amount: bigint, precision: number): number {
  const base = 10n ** BigInt(precision);
  return Number(amount / base) + Number(amount % base) / Number(base);
}

/** One entry per asset: the same CAT held by several sources is summed. */
export function mergeHoldings(lists: Holding[][]): Holding[] {
  const map = new Map<string, Holding>();
  lists.flat().forEach((h) => {
    const key = holdingKey(h);
    const existing = map.get(key);
    if (!existing) return map.set(key, { ...h });
    existing.amount += h.amount;
    existing.name ??= h.name;
    existing.ticker ??= h.ticker;
    existing.iconUrl ??= h.iconUrl;
  });
  return [...map.values()];
}

export function valuePortfolio(
  holdings: Holding[],
  markets: TokenMarketMap | undefined,
  xch: { usd: number; change24h: number | null } | null
): PortfolioSummary {
  const rows: ValuedHolding[] = holdings
    .filter((h) => h.amount > 0n)
    .map((h) => {
      const units = unitsOf(h.amount, h.precision);
      const priceXch =
        h.kind === "xch" ? 1 : h.assetId ? (markets?.[h.assetId]?.lastPriceXch ?? null) : null;
      const valueXch = priceXch === null ? null : units * priceXch;
      return {
        ...h,
        key: holdingKey(h),
        units,
        priceXch,
        valueXch,
        valueUsd: valueXch === null || !xch ? null : valueXch * xch.usd,
        share: null,
      };
    });
  const totalXch = rows.reduce((sum, r) => sum + (r.valueXch ?? 0), 0);
  rows.forEach((r) => {
    r.share = r.valueXch === null || totalXch <= 0 ? null : r.valueXch / totalXch;
  });
  rows.sort((a, b) =>
    a.valueXch === null && b.valueXch === null
      ? b.units - a.units
      : a.valueXch === null
        ? 1
        : b.valueXch === null
          ? -1
          : b.valueXch - a.valueXch
  );
  const totalUsd = xch ? totalXch * xch.usd : null;
  const change = xch?.change24h ?? null;
  const change24hUsd =
    totalUsd === null || change === null || change <= -1
      ? null
      : totalUsd - totalUsd / (1 + change);
  const priced = rows.filter((r) => r.valueXch !== null && r.valueXch > 0);
  return {
    rows,
    totalXch,
    totalUsd,
    change24hUsd,
    change24h: change24hUsd === null ? null : change,
    assetCount: rows.length,
    largest: priced[0] ?? null,
    unpricedCount: rows.length - rows.filter((r) => r.valueXch !== null).length,
  };
}

export interface AllocationSlice {
  key: string;
  /** Palette slot: 0 is XCH, 1..TOKEN_SLOTS tokens by value, "other" the grouped rest. */
  slot: number | "other";
  holding: ValuedHolding | null;
  valueXch: number;
  share: number;
  /** How many holdings an "other" slice groups. */
  count: number;
}

/** Colours a donut can keep apart for every reader (validated with the dataviz checks). */
export const TOKEN_SLOTS = 4;

/**
 * XCH always keeps its own slice and colour; the largest tokens take the next slots in value
 * order and everything priced beyond them folds into one "Other" slice.
 */
export function allocationSlices(summary: PortfolioSummary): AllocationSlice[] {
  const total = summary.totalXch;
  if (total <= 0) return [];
  const priced = summary.rows.filter((r) => r.valueXch !== null && r.valueXch > 0);
  const xch = priced.find((r) => r.kind === "xch");
  const tokens = priced.filter((r) => r.kind !== "xch");
  const slice = (r: ValuedHolding, slot: number): AllocationSlice => ({
    key: r.key,
    slot,
    holding: r,
    valueXch: r.valueXch!,
    share: r.valueXch! / total,
    count: 1,
  });
  const slices: AllocationSlice[] = [];
  if (xch) slices.push(slice(xch, 0));
  tokens.slice(0, TOKEN_SLOTS).forEach((r, i) => slices.push(slice(r, i + 1)));
  const rest = tokens.slice(TOKEN_SLOTS);
  if (rest.length) {
    const value = rest.reduce((sum, r) => sum + r.valueXch!, 0);
    slices.push({
      key: "other",
      slot: "other",
      holding: null,
      valueXch: value,
      share: value / total,
      count: rest.length,
    });
  }
  return slices;
}
