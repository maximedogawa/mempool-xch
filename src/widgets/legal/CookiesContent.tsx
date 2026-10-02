"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/shared/config/legal";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { CookieSettingsButton } from "./CookieSettingsButton";
import { LegalPage, linkClass, List, Section } from "./LegalPage";
import legalNs from "@/shared/i18n/messages/en/legal";

const NECESSARY = [
  { key: "mempool-xch:settings:v1", row: "settings" },
  { key: "mempool-xch:tokens:v2", row: "tokens" },
  { key: "mempool-xch:history:v1:<network>", row: "history" },
  { key: "mempool-xch:mempool-snapshot:v1:<network>", row: "snapshot" },
  { key: "mempool-xch:watchlist:v1", row: "watchlist" },
  { key: "mempool-xch:goggles:v1", row: "goggles" },
  { key: "mempool-xch:map:seen:v1:<network>", row: "mapSeen" },
  { key: "mempool-xch:sage-refused:v1", row: "sageRefused" },
  { key: "mempool-xch:consent:v1", row: "consent" },
] as const;

const CATEGORIES = ["necessary", "analytics", "advertising"] as const;

export function CookiesContent() {
  const t = useT(legalNs);
  const bold = (chunks: ReactNode) => <strong className="text-fg">{chunks}</strong>;
  return (
    <LegalPage
      title={t("cookies.title")}
      current={routes.legalCookies()}
      intro={<p>{t("cookies.intro", { site: SITE_NAME })}</p>}
    >
      <Section title={t("cookies.categories.title")} id="categories">
        <List>
          {CATEGORIES.map((category) => (
            <li key={category}>{t.rich(`cookies.categories.${category}`, { b: bold })}</li>
          ))}
        </List>
      </Section>

      <Section title={t("cookies.necessary.title")} id="necessary">
        <div
          className="overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label={t("cookies.necessary.title")}
        >
          <table className="w-full min-w-[560px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border text-fg">
                <th scope="col" className="py-2 pr-3 font-semibold">
                  {t("cookies.necessary.columns.key")}
                </th>
                <th scope="col" className="py-2 pr-3 font-semibold">
                  {t("cookies.necessary.columns.purpose")}
                </th>
                <th scope="col" className="py-2 font-semibold">
                  {t("cookies.necessary.columns.kept")}
                </th>
              </tr>
            </thead>
            <tbody>
              {NECESSARY.map(({ key, row }) => (
                <tr key={key} className="border-b border-border align-top">
                  <td className="mono py-2 pr-3 text-fg">{key}</td>
                  <td className="py-2 pr-3">{t(`cookies.necessary.rows.${row}.purpose`)}</td>
                  <td className="py-2">{t(`cookies.necessary.rows.${row}.lifetime`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>{t("cookies.necessary.notShared")}</p>
      </Section>

      <Section title={t("cookies.choice.title")} id="choice">
        <p>{t("cookies.choice.body")}</p>
        <div>
          <CookieSettingsButton />
        </div>
        <p>{t("cookies.choice.signal")}</p>
      </Section>

      <Section title={t("cookies.thirdParties.title")} id="third-parties">
        <p>
          {t.rich("cookies.thirdParties.body", {
            link: (chunks: ReactNode) => (
              <Link href={routes.legalPrivacy()} className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </Section>
    </LegalPage>
  );
}
