/** Locale-aware number output for the plain formatting helpers (amounts, fee rates, costs). */
import { getActiveLocale, intlTag } from "./active";
import type { Locale } from "./config";

const formats = new Map<string, Intl.NumberFormat>();

export function numberFormat(
  locale: Locale = getActiveLocale(),
  options: Intl.NumberFormatOptions = {}
): Intl.NumberFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(intlTag(locale), options);
    formats.set(key, format);
  }
  return format;
}

/** Grouped integer, e.g. 1,234,567 / 1.234.567; bigint-safe. */
export function formatInteger(value: number | bigint, locale: Locale = getActiveLocale()): string {
  return numberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

/** Fixed number of fraction digits with the locale's separators (toFixed, localised). */
export function formatFixed(
  value: number,
  digits: number,
  locale: Locale = getActiveLocale()
): string {
  return numberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function decimalSeparator(locale: Locale = getActiveLocale()): string {
  return (
    numberFormat(locale)
      .formatToParts(1.5)
      .find((part) => part.type === "decimal")?.value ?? "."
  );
}
