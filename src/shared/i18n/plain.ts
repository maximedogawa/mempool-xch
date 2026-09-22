/**
 * Translator for code outside React (formatting helpers, lib modules): reads the active locale,
 * whose messages I18nProvider has loaded before switching to it.
 */
import { getActiveLocale } from "./active";
import { cachedMessages, englishMessages } from "./messages";
import type { EnglishMessages, Namespace } from "./messages/types";
import { createTranslator, type MessageKey, type MessageTree, type Translator } from "./translate";

export function plainT<N extends Namespace>(
  namespace: N
): Translator<MessageKey<EnglishMessages[N]>> {
  const locale = getActiveLocale();
  return createTranslator(
    locale,
    cachedMessages(locale)?.[namespace] as MessageTree | undefined,
    englishMessages[namespace] as MessageTree
  );
}
