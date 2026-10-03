import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { RUNTIME_CONFIG_PATH } from "@/shared/config/runtime";
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

const IS_SAGE_BUILD = process.env.NEXT_PUBLIC_SAGE_BUILD === "1";

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
        {/* The server's run-time settings (the site's nodexch key), read before any app module
            runs. The Sage export has no server to answer it. */}
        {IS_SAGE_BUILD ? null : <Script src={RUNTIME_CONFIG_PATH} strategy="beforeInteractive" />}
      </body>
    </html>
  );
}
