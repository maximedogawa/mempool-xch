"use client";

import { useMemo } from "react";
import type { Locale } from "./config";
import { useI18n } from "./I18nProvider";
import { englishMessages } from "./messages";
import type { EnglishMessages, Namespace } from "./messages/types";
import { createTranslator, type MessageKey, type MessageTree, type Translator } from "./translate";

/** Translator for one namespace: `const t = useT("tx"); t("title")`. */
export function useT<N extends Namespace>(
  namespace: N
): Translator<MessageKey<EnglishMessages[N]>> {
  const { locale, messages } = useI18n();
  return useMemo(
    () =>
      createTranslator<MessageKey<EnglishMessages[N]>>(
        locale,
        messages[namespace] as MessageTree,
        englishMessages[namespace] as MessageTree
      ),
    [locale, messages, namespace]
  );
}

export function useLocale(): Locale {
  return useI18n().locale;
}
