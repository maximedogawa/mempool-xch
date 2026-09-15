"use client";

import Link from "next/link";
import { routes } from "@/shared/lib/routes";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { ExternalLink } from "@/shared/ui/ExternalLink";

export function Footer() {
  const { endpoints, networkConfig } = useSettings();
  const { inSage } = useSage();
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "";
  return (
    <footer className="mt-10 border-t border-border" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-6 text-xs text-fg-faint sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            Mempool.xch v{version}
            {sha ? <span className="mono"> ({sha})</span> : null}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {inSage ? "wallet data from Sage · chain data: " : ""}
            {networkConfig.label} via <span className="mono">{endpoints.rpcUrl.replace(/^https?:\/\//, "")}</span>
            {endpoints.isCoinset ? "" : " (custom node)"}
          </span>
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
    </footer>
  );
}
