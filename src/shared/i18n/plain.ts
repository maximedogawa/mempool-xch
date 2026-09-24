/**
 * Translator for code outside React (formatting helpers, lib modules): reads the active locale,
 * whose messages I18nProvider has loaded before switching to it.
 */
import { getActiveLocale } from "./active";
import { cachedMessages } from "./messages";
import {
  createTranslator,
  type MessageKey,
  type MessageTree,
  type NamespaceDef,
  type Translator,
} from "./translate";

export function plainT<N extends string, M>(
  namespace: NamespaceDef<N, M>
): Translator<MessageKey<M>> {
  const locale = getActiveLocale();
  return createTranslator(
    locale,
    (cachedMessages(locale) as Record<string, MessageTree> | null | undefined)?.[namespace.name],
    namespace.messages as MessageTree
  );
}
