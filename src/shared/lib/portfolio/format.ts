/** Display formatting for portfolio and market figures (third-party prices, plain numbers). */
import { numberFormat } from "@/shared/i18n/number";

/** US dollars: cents above one dollar, four significant digits below, "<$0.0001" at the floor. */
export function formatUsd(value: number): string {
  const abs = Math.abs(value);
  if (abs > 0 && abs < 0.0001) return `<${formatUsd(0.0001 * Math.sign(value))}`;
  const options: Intl.NumberFormatOptions =
    abs === 0 || abs >= 1
      ? {
          style: "currency",
          currency: "USD",
          currencyDisplay: "narrowSymbol",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      : {
          style: "currency",
          currency: "USD",
          currencyDisplay: "narrowSymbol",
          maximumSignificantDigits: 4,
        };
  return numberFormat(undefined, options).format(value);
}

/** Signed USD for a change, e.g. "+$12.30" / "−$4.00". */
export function formatUsdChange(value: number): string {
  const text = formatUsd(Math.abs(value));
  return value > 0 ? `+${text}` : value < 0 ? `−${text}` : text;
}

/** Signed percentage from a ratio, e.g. "+1.23%". */
export function formatChangePercent(ratio: number): string {
  const text = numberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(ratio));
  return ratio > 0 ? `+${text}` : ratio < 0 ? `−${text}` : text;
}

/** A token or XCH amount in whole units: up to four decimals, or four significant below 1. */
export function formatUnits(units: number): string {
  const abs = Math.abs(units);
  return numberFormat(
    undefined,
    abs > 0 && abs < 1 ? { maximumSignificantDigits: 4 } : { maximumFractionDigits: 4 }
  ).format(units);
}

/** Compact USD for wide ranges (volume, liquidity): "$1.2m", "$950". */
export function formatUsdCompact(value: number): string {
  if (Math.abs(value) < 1000) return formatUsd(value);
  return numberFormat(undefined, {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
