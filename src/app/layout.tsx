import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { RUNTIME_CONFIG_PATH } from "@/shared/config/runtime";
import { DEFAULT_THEME, SCHEME_THEMES, themeById } from "@/shared/theme";
import { AppProviders } from "@/shared/providers/AppProviders";
import { AppShell } from "@/widgets/shell/AppShell";
import "./globals.css";

// Self-hosted at build time, so no request reaches Google and the Sage CSP (font-src 'self') holds.
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const IS_SAGE_BUILD = process.env.NEXT_PUBLIC_SAGE_BUILD === "1";

/** Names the mark the app icons show (Beidwerk p151, the cube). Not in the Sage snapshot, which
 *  serves its files by exact path. */
const ICON_QUERY = IS_SAGE_BUILD ? "" : "?v=p151";

export const metadata: Metadata = {
  metadataBase: new URL("https://mempoolxch.space"),
  title: { default: "mempoolxch.space · Chia mempool explorer", template: "%s · mempoolxch.space" },
  description: "A mempool.space-style explorer for the Chia (XCH) network",
  applicationName: "mempoolxch.space",
  // iOS ignores the SVG and, without an apple icon, puts a screenshot on the home screen. The
  // query changes with the mark, so a phone that cached an older icon fetches this one.
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: `/icons/icon-32.png${ICON_QUERY}`, sizes: "32x32", type: "image/png" },
      { url: `/icons/icon-192.png${ICON_QUERY}`, sizes: "192x192", type: "image/png" },
      { url: `/icons/icon-512.png${ICON_QUERY}`, sizes: "512x512", type: "image/png" },
    ],
    apple: { url: `/icons/icon-180.png${ICON_QUERY}`, sizes: "180x180", type: "image/png" },
  },
  // The name under the icon on the home screen.
  appleWebApp: { title: "mempoolxch" },
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
      className={`${archivo.variable} ${plexMono.variable}`}
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
