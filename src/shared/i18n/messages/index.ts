/**
 * Message loading. English is not loaded here: each component imports the English namespaces it
 * uses (see NamespaceDef), so it ships with that route's bundle and doubles as the fallback for
 * any gap. The other locales are separate chunks fetched when chosen, which works in the static
 * Sage export.
 */
import type { Locale } from "../config";
import type { Messages } from "./types";

const loaders: Record<Exclude<Locale, "en">, () => Promise<{ default: Messages }>> = {
  de: () => import("./de"),
  es: () => import("./es"),
  zh: () => import("./zh"),
};

/** Loaded translations; `null` for English, whose text comes from the namespaces themselves. */
const cache = new Map<Locale, Messages | null>([["en", null]]);

/** `undefined` while a locale is not loaded yet. */
export function cachedMessages(locale: Locale): Messages | null | undefined {
  return cache.get(locale);
}

export async function loadMessages(locale: Locale): Promise<Messages | null> {
  const cached = cache.get(locale);
  if (cached !== undefined) return cached;
  const messages = (await loaders[locale as Exclude<Locale, "en">]()).default;
  cache.set(locale, messages);
  return messages;
}
