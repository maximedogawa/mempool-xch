import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { DEFAULT_THEME, SCHEME_THEMES, themeById } from "@/shared/theme";
import { AppProviders } from "@/shared/providers/AppProviders";
import { AppShell } from "@/widgets/shell/AppShell";
import "./globals.css";

// Self-hosted at build time, so no request reaches Google and the Sage CSP (font-src 'self') holds.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mempoolxch.space"),
  title: { default: "mempoolxch.space · Chia mempool explorer", template: "%s · mempoolxch.space" },
  description: "A mempool.space-style explorer for the Chia (XCH) network",
  applicationName: "mempoolxch.space",
  icons: { icon: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: (["light", "dark"] as const).map((scheme) => ({
    media: `(prefers-color-scheme: ${scheme})`,
    color: themeById(SCHEME_THEMES[scheme]).tokens.bg,
  })),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-app="mempoolxch"
      data-theme={DEFAULT_THEME}
      className={`${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
