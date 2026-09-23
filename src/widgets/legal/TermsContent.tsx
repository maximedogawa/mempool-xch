"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/shared/config/legal";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { LegalPage, linkClass, List, Section } from "./LegalPage";

const SERVICE_ITEMS = ["funds", "transactions", "accounts", "mica", "sage"] as const;
const DATA_ITEMS = ["delayed", "estimates", "names"] as const;
const USE_ITEMS = ["rate", "access", "unlawful", "endorse"] as const;
const LIABILITY_ITEMS = [
  "unlimited",
  "slight",
  "excluded",
  "decisions",
  "representatives",
] as const;

export function TermsContent() {
  const t = useT("legal");
  const site = SITE_NAME;
  return (
    <LegalPage
      title={t("terms.title")}
      current={routes.legalTerms()}
      intro={
        <p>
          {t.rich("terms.intro", {
            site,
            link: (chunks: ReactNode) => (
              <Link href={routes.legalNotice()} className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      }
    >
      <Section title={t("terms.service.title")} id="service">
        <p>{t("terms.service.body")}</p>
        <List>
          {SERVICE_ITEMS.map((item) => (
            <li key={item}>{t(`terms.service.items.${item}`)}</li>
          ))}
        </List>
      </Section>

      <Section title={t("terms.noAdvice.title")} id="no-advice">
        <p>{t("terms.noAdvice.body")}</p>
      </Section>

      <Section title={t("terms.data.title")} id="data">
        <p>{t("terms.data.intro")}</p>
        <List>
          {DATA_ITEMS.map((item) => (
            <li key={item}>{t(`terms.data.items.${item}`)}</li>
          ))}
        </List>
        <p>{t("terms.data.asIs")}</p>
      </Section>

      <Section title={t("terms.use.title")} id="use">
        <p>{t("terms.use.intro")}</p>
        <List>
          {USE_ITEMS.map((item) => (
            <li key={item}>{t(`terms.use.items.${item}`, { site })}</li>
          ))}
        </List>
        <p>{t("terms.use.automated")}</p>
      </Section>

      <Section title={t("terms.thirdParty.title")} id="third-party">
        <p>{t("terms.thirdParty.body")}</p>
      </Section>

      <Section title={t("terms.liability.title")} id="liability">
        <p>{t("terms.liability.intro")}</p>
        <ol className="list-decimal space-y-1 pl-5">
          {LIABILITY_ITEMS.map((item) => (
            <li key={item}>{t(`terms.liability.items.${item}`)}</li>
          ))}
        </ol>
      </Section>

      <Section title={t("terms.openSource.title")} id="open-source">
        <p>{t("terms.openSource.body")}</p>
      </Section>

      <Section title={t("terms.changes.title")} id="changes">
        <p>{t("terms.changes.body")}</p>
      </Section>

      <Section title={t("terms.law.title")} id="law">
        <p>{t("terms.law.choice")}</p>
        <p>{t("terms.law.venue")}</p>
        <p>{t("terms.law.disputes")}</p>
      </Section>

      <Section title={t("terms.severability.title")} id="severability">
        <p>{t("terms.severability.body")}</p>
      </Section>
    </LegalPage>
  );
}
