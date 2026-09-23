"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/shared/config/legal";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { LegalPage, linkClass, List, Section } from "./LegalPage";
import legalNs from "@/shared/i18n/messages/en/legal";

const LOG_ITEMS = ["purpose", "basis", "retention", "hosting"] as const;
const THIRD_PARTY_ITEMS = [
  "dexie",
  "mintgarden",
  "nftHosts",
  "xchandles",
  "coinset",
  "node",
  "map",
] as const;
const RIGHTS_ITEMS = ["access", "rectification", "restriction", "objection", "complaint"] as const;

export function PrivacyContent() {
  const t = useT(legalNs);
  const bold = (chunks: ReactNode) => <strong className="text-fg">{chunks}</strong>;
  return (
    <LegalPage
      title={t("privacy.title")}
      current={routes.legalPrivacy()}
      intro={<p>{t("privacy.intro", { site: SITE_NAME })}</p>}
    >
      <Section title={t("privacy.controller.title")} id="controller">
        <p>
          {t.rich("privacy.controller.body", {
            link: (chunks: ReactNode) => (
              <Link href={routes.legalNotice()} className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </p>
      </Section>

      <Section title={t("privacy.logs.title")} id="logs">
        <p>{t("privacy.logs.intro")}</p>
        <List>
          {LOG_ITEMS.map((item) => (
            <li key={item}>{t(`privacy.logs.items.${item}`)}</li>
          ))}
        </List>
        <p>{t("privacy.logs.noProxy")}</p>
        <p>{t("privacy.logs.market")}</p>
      </Section>

      <Section title={t("privacy.storage.title")} id="local-storage">
        <p>
          {t.rich("privacy.storage.body", {
            link: (chunks: ReactNode) => (
              <Link href={routes.legalCookies()} className={linkClass}>
                {chunks}
              </Link>
            ),
          })}
        </p>
        <p>{t("privacy.storage.notifications")}</p>
      </Section>

      <Section title={t("privacy.thirdParties.title")} id="third-parties">
        <p>{t("privacy.thirdParties.intro")}</p>
        <List>
          {THIRD_PARTY_ITEMS.map((item) => (
            <li key={item}>{t(`privacy.thirdParties.items.${item}`)}</li>
          ))}
        </List>
        <p>{t("privacy.thirdParties.basis")}</p>
        <p>{t("privacy.thirdParties.publicData")}</p>
      </Section>

      <Section title={t("privacy.sage.title")} id="sage">
        <p>{t("privacy.sage.body")}</p>
      </Section>

      <Section title={t("privacy.noTracking.title")} id="no-tracking">
        <p>{t("privacy.noTracking.body")}</p>
      </Section>

      <Section title={t("privacy.rights.title")} id="rights">
        <p>{t("privacy.rights.intro")}</p>
        <List>
          {RIGHTS_ITEMS.map((item) => (
            <li key={item}>{t.rich(`privacy.rights.items.${item}`, { b: bold })}</li>
          ))}
        </List>
        <p>{t("privacy.rights.contact")}</p>
      </Section>

      <Section title={t("privacy.other.title")} id="other">
        <p>{t("privacy.other.body")}</p>
      </Section>
    </LegalPage>
  );
}
