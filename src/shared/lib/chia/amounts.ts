import { CHIA } from "@/shared/config/networks";

/** All amounts are bigint mojos end to end. */
export type Mojos = bigint;

/** Coerce anything the RPC or indexed API sends (number, decimal string, bigint) to mojos. */
export function toMojos(value: number | string | bigint | null | undefined): Mojos {
  if (value === null || value === undefined) return 0n;
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.trunc(value));
  const v = value.trim();
  if (v === "") return 0n;
  return BigInt(v);
}

function formatDecimal(mojos: Mojos, decimals: number, maxFractionDigits: number): string {
  const negative = mojos < 0n;
  const abs = negative ? -mojos : mojos;
  const base = 10n ** BigInt(decimals);
  const whole = abs / base;
  const frac = abs % base;
  const wholeStr = whole.toLocaleString("en-US");
  let fracStr = frac.toString().padStart(decimals, "0").slice(0, maxFractionDigits);
  fracStr = fracStr.replace(/0+$/, "");
  return `${negative ? "-" : ""}${wholeStr}${fracStr ? `.${fracStr}` : ""}`;
}

/** Full-precision XCH string, e.g. 1234.000000000123. */
export function formatXch(mojos: Mojos, maxFractionDigits = 12): string {
  return formatDecimal(mojos, 12, maxFractionDigits);
}

/** CAT units (3 decimals). */
export function formatCat(mojos: Mojos, maxFractionDigits = 3): string {
  return formatDecimal(mojos, 3, maxFractionDigits);
}

/** Keep at most `n` significant digits in the fractional part of "0.000123456". */
function trimSignificant(decimal: string, n: number): string {
  const [whole, frac] = decimal.split(".");
  if (!frac || whole?.replace("-", "") !== "0") return decimal;
  const match = /^(0*)(\d+)$/.exec(frac);
  if (!match) return decimal;
  const kept = `${match[1]}${match[2]!.slice(0, n)}`.replace(/0+$/, "");
  return kept ? `${whole}.${kept}` : `${whole}`;
}

/** Compact, human-scale display: picks mojos, or XCH with sensible precision. */
export function formatAmount(mojos: Mojos, unit: "xch" | "cat" = "xch"): string {
  if (unit === "cat") return `${formatCat(mojos)} CAT`;
  const abs = mojos < 0n ? -mojos : mojos;
  if (abs === 0n) return "0 XCH";
  if (abs < 1_000_000n) return `${mojos.toLocaleString("en-US")} mojo`;
  if (abs < CHIA.MOJOS_PER_XCH / 1000n) return `${trimSignificant(formatXch(mojos, 12), 4)} XCH`;
  if (abs < CHIA.MOJOS_PER_XCH) return `${formatXch(mojos, 6)} XCH`;
  if (abs < CHIA.MOJOS_PER_XCH * 1000n) return `${formatXch(mojos, 4)} XCH`;
  return `${formatXch(mojos, 2)} XCH`;
}

/** Mojos per CLVM cost, the Chia fee rate. Kept as a float for display only. */
export function feePerCost(fee: Mojos, cost: number): number {
  if (cost <= 0) return 0;
  return Number(fee) / cost;
}

export function formatFeeRate(rate: number): string {
  if (rate === 0) return "0";
  if (rate < 0.001) return "<0.001";
  if (rate < 1) return rate.toFixed(3);
  if (rate < 100) return rate.toFixed(2);
  return Math.round(rate).toLocaleString("en-US");
}

export function formatCost(cost: number): string {
  if (cost >= 1_000_000_000) return `${(cost / 1_000_000_000).toFixed(2)}B`;
  if (cost >= 1_000_000) return `${(cost / 1_000_000).toFixed(1)}M`;
  if (cost >= 1_000) return `${(cost / 1_000).toFixed(0)}k`;
  return cost.toString();
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}
