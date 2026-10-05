"use client";

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { setActiveLocale } from "./active";
import { DEFAULT_LOCALE, INTL_TAGS, resolveLocale, type Locale } from "./config";
import { cachedMessages, loadMessages } from "./messages";
import type { Messages } from "./messages/types";

interface I18nContextValue {
  locale: Locale;
  /** Translations of the active locale; null for English (the namespaces carry it). */
  messages: Messages | null;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  messages: null,
});

const subscribeLanguages = (onChange: () => void) => {
  window.addEventListener("languagechange", onChange);
  return () => window.removeEventListener("languagechange", onChange);
};
const browserLanguages = () => navigator.languages?.join(",") ?? navigator.language ?? "";
// The static build and the hydration render are always English; the stored choice applies next.
const serverLanguages = () => "";

/**
 * Picks the language from settings (or the browser for "auto"), loads its messages and renders
 * the app in it. The subtree remounts on a change so memoised text and the formatting helpers
 * that read the active locale all switch together, without a page reload.
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const { settings, hydrated } = useSettings();
  const languages = useSyncExternalStore(subscribeLanguages, browserLanguages, serverLanguages);
  const wanted = hydrated
    ? resolveLocale(settings.locale, languages ? languages.split(",") : [])
    : DEFAULT_LOCALE;
  const [loaded, setLoaded] = useState<I18nContextValue>({
    locale: DEFAULT_LOCALE,
    messages: null,
  });
  const ready = cachedMessages(wanted);
  const current = ready !== undefined ? { locale: wanted, messages: ready } : loaded;

  useEffect(() => {
    if (cachedMessages(wanted) !== undefined) return;
    let cancelled = false;
    loadMessages(wanted)
      .then((messages) => {
        if (!cancelled) setLoaded({ locale: wanted, messages });
      })
      .catch(() => {
        // Chunk failed to load (offline): stay on the language already shown.
      });
    return () => {
      cancelled = true;
    };
  }, [wanted]);

  useEffect(() => {
    document.documentElement.lang = INTL_TAGS[current.locale];
  }, [current.locale]);

  setActiveLocale(current.locale);
  const value = useMemo(
    () => ({ locale: current.locale, messages: current.messages }),
    [current.locale, current.messages]
  );
  return (
    <I18nContext.Provider value={value}>
      <Fragment key={current.locale}>{children}</Fragment>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
