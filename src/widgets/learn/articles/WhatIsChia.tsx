"use client";

import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "../LearnArticle";
import { linkTag, PROSE_TAGS } from "./tags";
import learnNs from "@/shared/i18n/messages/en/learn";

export function WhatIsChia() {
  const t = useT(learnNs);
  return (
    <LearnArticle slug="what-is-chia">
      <p>
        {t.rich("whatIsChia.intro", {
          ...PROSE_TAGS,
          pos: linkTag(routes.learnArticle("proof-of-space-and-time")),
        })}
      </p>
      <h2>{t("whatIsChia.coinsTitle")}</h2>
      <p>{t.rich("whatIsChia.coins", PROSE_TAGS)}</p>
      <h2>{t("whatIsChia.programsTitle")}</h2>
      <p>
        {t.rich("whatIsChia.programs", {
          ...PROSE_TAGS,
          tokens: linkTag(routes.tokens()),
          offers: linkTag(routes.learnArticle("offers-and-trading")),
        })}
      </p>
      <h2>{t("whatIsChia.blocksTitle")}</h2>
      <p>{t.rich("whatIsChia.blocks", { ...PROSE_TAGS, dashboard: linkTag(routes.home()) })}</p>
      <h2>{t("whatIsChia.originTitle")}</h2>
      <p>{t.rich("whatIsChia.origin", { ...PROSE_TAGS, prefarm: linkTag(routes.prefarm()) })}</p>
    </LearnArticle>
  );
}
