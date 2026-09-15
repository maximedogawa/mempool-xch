"use client";

import type { ReactNode } from "react";
import { LiveProvider } from "./LiveProvider";
import { QueryProvider } from "./QueryProvider";
import { SettingsProvider } from "./SettingsProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <QueryProvider>
          <LiveProvider>{children}</LiveProvider>
        </QueryProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}
