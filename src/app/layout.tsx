import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/shared/providers/AppProviders";
import { AppShell } from "@/widgets/shell/AppShell";
import "./globals.css";

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
  themeColor: "#0f1220",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
        >
          Skip to content
        </a>
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
