/**
 * Fixed-point decimals for market data. Exchange prices and amounts arrive as decimal strings
 * (Gate, OKX) or JSON numbers (HTX, Dexie). Everything that is compared, subtracted or divided is
 * a bigint scaled by 10^decimals; numbers only appear at the edge, for formatting and pixels.
 */
import { decimalSeparator, formatInteger } from "@/shared/i18n/number";

/** Prices are scaled by 10^8 (quote units per XCH). */
export const PRICE_DECIMALS = 8;
export const PRICE_SCALE = 10n ** BigInt(PRICE_DECIMALS);

const DECIMAL = /^(\d+)(?:\.(\d+))?$/;

/**
 * Parse a non-negative decimal (string or finite number) to a bigint scaled by 10^decimals,
 * rounding half up past the last kept digit. JSON numbers are read from their shortest decimal
 * form, so 1.6345 stays 1.6345 rather than 1.63449999…; exponent forms are expanded first.
 */
export function parseScaled(raw: unknown, decimals: number = PRICE_DECIMALS): bigint | null {
  let text: string;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return null;
    text = String(raw);
    if (/e/i.test(text)) text = raw.toFixed(Math.min(100, decimals + 1));
  } else if (typeof raw === "string") {
    text = raw.trim();
  } else {
    return null;
  }
  const match = DECIMAL.exec(text);
  if (!match) return null;
  const whole = match[1]!;
  const frac = match[2] ?? "";
  const kept = frac.slice(0, decimals).padEnd(decimals, "0");
  let value = BigInt(whole + kept);
  if ((frac[decimals] ?? "0") >= "5") value += 1n;
  return value;
}

/** Integer division rounded half away from zero. */
export function divRound(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new RangeError("division by zero");
  const negative = numerator < 0n !== denominator < 0n;
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const q = (n + d / 2n) / d;
  return negative ? -q : q;
}

/** Round a scaled value to `digits` fraction digits (still scaled by 10^decimals). */
function roundTo(value: bigint, decimals: number, digits: number): bigint {
  if (digits >= decimals) return value;
  const step = 10n ** BigInt(decimals - digits);
  return divRound(value, step) * step;
}

/** Locale-formatted fixed-point value with exactly `digits` fraction digits. */
export function formatScaled(
  value: bigint | null | undefined,
  digits: number,
  decimals: number = PRICE_DECIMALS,
  signed = false
): string {
  if (value === null || value === undefined) return "—";
  const rounded = roundTo(value, decimals, digits);
  const negative = rounded < 0n;
  const abs = negative ? -rounded : rounded;
  const base = 10n ** BigInt(decimals);
  const whole = formatInteger(abs / base);
  const frac = (abs % base).toString().padStart(decimals, "0").slice(0, digits);
  const sign = negative ? "−" : signed && abs > 0n ? "+" : "";
  return `${sign}${whole}${digits > 0 ? `${decimalSeparator()}${frac}` : ""}`;
}

/** Digits worth showing for a price: 4 below 10, 2 above. */
export function priceDigits(value: bigint | null | undefined): number {
  return value !== null && value !== undefined && value >= 10n * PRICE_SCALE ? 2 : 4;
}

/** Price with its natural number of digits, e.g. 1.6310 or 12.50. */
export function formatPrice(value: bigint | null | undefined): string {
  return formatScaled(value, priceDigits(value));
}

/** (a - b) / b as parts per million, integer math. */
export function ratioPpm(difference: bigint, base: bigint): bigint | null {
  return base === 0n ? null : divRound(difference * 1_000_000n, base);
}

/** A ppm ratio as a percent string with `digits` decimals, e.g. 0.1234 %. */
export function formatPpmPercent(
  ppm: bigint | null | undefined,
  digits = 2,
  signed = false
): string {
  if (ppm === null || ppm === undefined) return "—";
  return `${formatScaled(ppm, digits, 4, signed)}%`;
}

/** Scaled value to a JS number, only for pixel positions and chart scales. */
export function toNumber(value: bigint, decimals: number = PRICE_DECIMALS): number {
  return Number(value) / 10 ** decimals;
}
