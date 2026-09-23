/**
 * Message loading. English ships in the main bundle (it is also the fallback for any gap); the
 * other locales are separate chunks fetched when chosen, which works in the static Sage export.
 */
import type { Locale } from "../config";
import en from "./en";
import type { Messages } from "./types";

export { en as englishMessages };

const loaders: Record<Exclude<Locale, "en">, () => Promise<{ default: Messages }>> = {
  de: () => import("./de"),
  es: () => import("./es"),
  zh: () => import("./zh"),
};

const cache = new Map<Locale, Messages>([["en", en]]);

export function cachedMessages(locale: Locale): Messages | undefined {
  return cache.get(locale);
}

export async function loadMessages(locale: Locale): Promise<Messages> {
  const cached = cache.get(locale);
  if (cached) return cached;
  const messages = (await loaders[locale as Exclude<Locale, "en">]()).default;
  cache.set(locale, messages);
  return messages;
}
