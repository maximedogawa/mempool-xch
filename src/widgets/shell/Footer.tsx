"use client";

import Link from "next/link";
import { useServerStatus } from "@/shared/api/hooks";
import { describeChannel } from "@/shared/lib/live/channel";
import { routes } from "@/shared/lib/routes";
import { useConsent } from "@/shared/providers/ConsentProvider";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { ExternalLink } from "@/shared/ui/ExternalLink";

export function Footer() {
  const { endpoints, networkConfig } = useSettings();
  const { inSage } = useSage();
  const { status, transport } = useLive();
  const server = useServerStatus();
  const { openSettings } = useConsent();
  const channel = describeChannel({ status, transport, rpcUrl: endpoints.rpcUrl, eventsUrl: endpoints.eventsUrl, wsUrl: endpoints.wsUrl, isCoinset: endpoints.isCoinset, serverChannel: server.data?.hub?.channel ?? null });
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "";
  return (
    <footer className="mt-10 border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 pt-6 text-xs text-fg-faint sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            mempoolxch.space v{version}
            {sha ? <span className="mono"> ({sha})</span> : null}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {inSage ? "wallet data from Sage · chain data: " : ""}
            {networkConfig.label} via <span className="mono">{endpoints.rpcUrl.replace(/^https?:\/\//, "")}</span>
            {endpoints.isCoinset ? "" : " (custom node)"}
          </span>
          <span aria-hidden="true">·</span>
          <span title={channel.detail}>live: {channel.name.toLowerCase()}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href={routes.docs()} className="hover:text-fg">
            Help
          </Link>
          <Link href={routes.settings()} className="hover:text-fg">
            Settings
          </Link>
          <ExternalLink href="https://coinset.org" className="hover:text-fg">
            Data by Coinset
          </ExternalLink>
          <ExternalLink href="https://github.com/maximedogawa/mempool-xch" className="hover:text-fg">
            GitHub
          </ExternalLink>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 pt-3 pb-6 text-xs text-fg-faint">
        <p data-testid="footer-disclaimer">
          General information only, not financial, investment, tax or legal advice; do your own research. Chain data is shown as is and as available, may be
          delayed, incomplete or wrong, and availability is not guaranteed. mempoolxch.space is an independent project, not affiliated with or endorsed by
          Chia Network Inc.
        </p>
        <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href={routes.legalTerms()} className="hover:text-fg">
            Terms of use
          </Link>
          <Link href={routes.legalNotice()} className="hover:text-fg">
            Legal notice
          </Link>
          <Link href={routes.legalPrivacy()} className="hover:text-fg">
            Privacy policy
          </Link>
          <Link href={routes.legalCookies()} className="hover:text-fg">
            Cookie policy
          </Link>
          <button type="button" onClick={openSettings} className="cursor-pointer border-0 bg-transparent p-0 text-fg-faint hover:text-fg">
            Cookie settings
          </button>
        </nav>
      </div>
    </footer>
  );
}
