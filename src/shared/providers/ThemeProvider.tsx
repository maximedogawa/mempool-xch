"use client";

import { useEffect, type ReactNode } from "react";
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
        root.setAttribute("data-theme", sageTheme);
        return;
      }
      const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
      const theme =
        settings.theme === "system" ? (prefersLight ? "light" : "dark") : settings.theme;
      root.setAttribute("data-theme", theme);
    };
    apply();
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, [settings.theme, sageTheme]);
  return <>{children}</>;
}
