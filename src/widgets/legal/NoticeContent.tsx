"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/shared/config/legal";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { ExternalLink } from "@/shared/ui/ExternalLink";
import { LegalPage, linkClass, List, Section } from "./LegalPage";
import legalNs from "@/shared/i18n/messages/en/legal";

const ATTRIBUTION = [
  { item: "source", href: "https://github.com/maximedogawa/mempool-xch" },
  { item: "chain", href: "https://coinset.org" },
  { item: "cats", href: "https://dexie.space" },
  { item: "nfts", href: "https://mintgarden.io" },
  { item: "ownership", href: null },
] as const;

export function NoticeContent() {
  const t = useT(legalNs);
  return (
    <LegalPage
      title={t("notice.title")}
      current={routes.legalNotice()}
      intro={<p>{t("notice.intro")}</p>}
    >
      <Section title={t("notice.independence.title")} id="independence">
        <p>{t("notice.independence.body", { site: SITE_NAME })}</p>
      </Section>

      <Section title={t("notice.liability.title")} id="liability">
        <p>
          {t.rich("notice.liability.content", {
            link: (chunks: ReactNode) => (
              <Link href={routes.legalTerms()} className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p>{t("notice.liability.links")}</p>
      </Section>

      <Section title={t("notice.report.title")} id="report">
        <p>{t("notice.report.body")}</p>
      </Section>

      <Section title={t("notice.attribution.title")} id="attribution">
        <List>
          {ATTRIBUTION.map(({ item, href }) => (
            <li key={item}>
              {t.rich(`notice.attribution.items.${item}`, {
                link: (chunks: ReactNode) =>
                  href ? (
                    <ExternalLink href={href} className={linkClass}>
                      {chunks}
                    </ExternalLink>
                  ) : (
                    chunks
                  ),
              })}
            </li>
          ))}
        </List>
      </Section>

      <Section title={t("notice.disputes.title")} id="disputes">
        <p>{t("notice.disputes.body")}</p>
      </Section>
    </LegalPage>
  );
}
