"use client";

import { useMemo } from "react";
import type { Locale } from "./config";
import { useI18n } from "./I18nProvider";
import {
  createTranslator,
  type MessageKey,
  type MessageTree,
  type NamespaceDef,
  type Translator,
} from "./translate";

/**
 * Translator for one namespace: `const t = useT(txNs); t("title")`, with `txNs` imported from
 * `@/shared/i18n/messages/en/tx`.
 */
export function useT<N extends string, M>(
  namespace: NamespaceDef<N, M>
): Translator<MessageKey<M>> {
  const { locale, messages } = useI18n();
  return useMemo(
    () =>
      createTranslator<MessageKey<M>>(
        locale,
        (messages as Record<string, MessageTree> | null)?.[namespace.name],
        namespace.messages as MessageTree
      ),
    [locale, messages, namespace]
  );
}

export function useLocale(): Locale {
  return useI18n().locale;
}
