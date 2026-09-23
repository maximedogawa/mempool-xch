/**
 * Supported UI languages. English is the source language: its message files define every key,
 * the other locales must translate all of them (enforced by the type checker).
 */
export const LOCALES = ["en", "de", "es", "zh"] as const;

export type Locale = (typeof LOCALES)[number];

/** "auto" follows the browser's preferred languages. */
export type LocalePreference = Locale | "auto";

export const DEFAULT_LOCALE: Locale = "en";

/** Each language named in itself, as the switcher shows it. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  zh: "中文",
};

/** BCP 47 tags handed to Intl and to <html lang>. */
export const INTL_TAGS: Record<Locale, string> = {
  en: "en-GB",
  de: "de-DE",
  es: "es-ES",
  zh: "zh-CN",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** First supported language in the browser's list ("de-AT" → "de"), else English. */
export function detectLocale(languages: readonly string[] | undefined): Locale {
  for (const tag of languages ?? []) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}

export function resolveLocale(
  preference: LocalePreference,
  languages: readonly string[] | undefined
): Locale {
  return preference === "auto" ? detectLocale(languages) : preference;
}
