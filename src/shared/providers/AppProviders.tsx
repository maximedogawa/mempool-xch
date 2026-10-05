"use client";

import type { ReactNode } from "react";
import { AssetRegistryLoader } from "@/shared/api/useTokenList";
import { I18nProvider } from "@/shared/i18n/I18nProvider";
import { ConsentProvider } from "./ConsentProvider";
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
            <LiveProvider>
              <ConsentProvider>
                <I18nProvider>{children}</I18nProvider>
              </ConsentProvider>
            </LiveProvider>
          </QueryProvider>
        </ThemeProvider>
      </SageProvider>
    </SettingsProvider>
  );
}
