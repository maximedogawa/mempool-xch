"use client";

import { useEffect, type ReactNode } from "react";
import { resolveTheme, SCHEME_THEMES } from "@/shared/theme";
import { useSage } from "./SageProvider";
import { useSettings } from "./SettingsProvider";

/** Applies the theme preference to <html data-theme>; inside Sage the host's theme wins. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const { sageTheme } = useSage();
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      if (sageTheme) {
        root.setAttribute("data-theme", SCHEME_THEMES[sageTheme]);
        return;
      }
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
      root.setAttribute("data-theme", resolveTheme(settings.theme, prefersDark));
    };
    apply();
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, [settings.theme, sageTheme]);
  return <>{children}</>;
}
