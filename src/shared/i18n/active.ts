/**
 * The locale the formatting helpers (amounts, times, fee rates) use when a caller does not pass
 * one. I18nProvider sets it before its subtree renders and remounts that subtree when it
 * changes, so plain functions stay correct without threading the locale through every call.
 */
import { DEFAULT_LOCALE, INTL_TAGS, type Locale } from "./config";

let active: Locale = DEFAULT_LOCALE;

export function getActiveLocale(): Locale {
  return active;
}

export function setActiveLocale(locale: Locale): void {
  active = locale;
}

export function intlTag(locale: Locale = active): string {
  return INTL_TAGS[locale];
}
