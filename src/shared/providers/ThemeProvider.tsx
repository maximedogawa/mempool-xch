"use client";

import { useEffect, type ReactNode } from "react";
import { useSettings } from "./SettingsProvider";

/** Applies the theme preference to <html data-theme>. Sage will override this later (TASK-019). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches;
      const theme = settings.theme === "system" ? (prefersLight ? "light" : "dark") : settings.theme;
      root.setAttribute("data-theme", theme);
    };
    apply();
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    mq?.addEventListener?.("change", apply);
    return () => mq?.removeEventListener?.("change", apply);
  }, [settings.theme]);
  return <>{children}</>;
}
