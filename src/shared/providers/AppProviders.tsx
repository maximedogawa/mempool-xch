"use client";

import type { ReactNode } from "react";
import { AssetRegistryLoader } from "@/shared/api/useTokenList";
import { LiveProvider } from "./LiveProvider";
import { QueryProvider } from "./QueryProvider";
import { SageProvider } from "./SageProvider";
import { SettingsProvider } from "./SettingsProvider";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <SageProvider>
        <ThemeProvider>
          <QueryProvider>
            <AssetRegistryLoader />
            <LiveProvider>{children}</LiveProvider>
          </QueryProvider>
        </ThemeProvider>
      </SageProvider>
    </SettingsProvider>
  );
}
