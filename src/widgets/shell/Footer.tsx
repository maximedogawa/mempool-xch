"use client";

import Link from "next/link";
import { useLocale, useT } from "@/shared/i18n/useT";
import { describeChannel } from "@/shared/lib/live/channel";
import { routes } from "@/shared/lib/routes";
import { useConsent } from "@/shared/providers/ConsentProvider";
import { useLiveValue } from "@/shared/providers/LiveProvider";
import { useSage } from "@/shared/providers/SageProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import shellNs from "@/shared/i18n/messages/en/shell";

export function Footer() {
  const t = useT(shellNs);
  const locale = useLocale();
  const { endpoints, networkConfig } = useSettings();
  const { inSage } = useSage();
  const status = useLiveValue("status");
  const transport = useLiveValue("transport");
  const { openSettings } = useConsent();
  const channel = describeChannel({
    status,
    transport,
    rpcUrl: endpoints.rpcUrl,
    wsUrl: endpoints.wsUrl,
    isCoinset: endpoints.isCoinset,
  });
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "";
  return (
    <footer
      className="mt-10 border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 pt-6 text-xs text-fg-faint sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>
            mempoolxch.space v{version}
            {sha ? <span className="mono"> ({sha})</span> : null}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {t.rich(
              inSage
                ? endpoints.isCoinset
                  ? "footer.sourceSage"
                  : "footer.sourceSageCustom"
                : endpoints.isCoinset
                  ? "footer.source"
                  : "footer.sourceCustom",
              {
                network: networkConfig.label,
                host: (c) => <span className="mono">{c}</span>,
                url: endpoints.rpcUrl.replace(/^https?:\/\//, ""),
              }
            )}
          </span>
          <span aria-hidden="true">·</span>
          <span title={channel.detail}>
            {t("footer.live", {
              // English reads the channel name in lower case here ("live: polling"); other
              // languages keep their own casing (German nouns stay capitalised).
              channel: locale === "en" ? channel.name.toLowerCase() : channel.name,
            })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href={routes.learn()} className="hover:text-fg">
            {t("footer.learn")}
          </Link>
          <Link href={routes.docs()} className="hover:text-fg">
            {t("footer.help")}
          </Link>
          <Link href={routes.api()} className="hover:text-fg">
            API
          </Link>
          <Link href={routes.map()} className="hover:text-fg">
            {t("footer.network")}
          </Link>
          <Link href={routes.vaults()} className="hover:text-fg">
            {t("footer.vaults")}
          </Link>
          <Link href={routes.status()} className="hover:text-fg">
            {t("footer.status")}
          </Link>
          <Link href={routes.changelog()} className="hover:text-fg">
            {t("footer.changelog")}
          </Link>
          <Link href={routes.settings()} className="hover:text-fg">
            {t("footer.settings")}
          </Link>
          <ExternalLink href="https://coinset.org" className="hover:text-fg">
            {t("footer.dataByCoinset")}
          </ExternalLink>
          <ExternalLink
            href="https://github.com/maximedogawa/mempool-xch"
            className="hover:text-fg"
          >
            GitHub
          </ExternalLink>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-4 pt-3 pb-6 text-xs text-fg-faint">
        <p data-testid="footer-disclaimer">{t("footer.disclaimer")}</p>
        <nav aria-label={t("footer.legal")} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link href={routes.legalTerms()} className="hover:text-fg">
            {t("footer.terms")}
          </Link>
          <Link href={routes.legalNotice()} className="hover:text-fg">
            {t("footer.notice")}
          </Link>
          <Link href={routes.legalPrivacy()} className="hover:text-fg">
            {t("footer.privacy")}
          </Link>
          <Link href={routes.legalCookies()} className="hover:text-fg">
            {t("footer.cookies")}
          </Link>
          <button
            type="button"
            onClick={openSettings}
            className="cursor-pointer border-0 bg-transparent p-0 text-fg-faint hover:text-fg"
          >
            {t("footer.cookieSettings")}
          </button>
        </nav>
      </div>
    </footer>
  );
}
