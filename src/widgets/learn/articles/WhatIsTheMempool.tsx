"use client";

import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "../LearnArticle";
import { linkTag, PROSE_TAGS } from "./tags";
import learnNs from "@/shared/i18n/messages/en/learn";

export function WhatIsTheMempool() {
  const t = useT(learnNs);
  return (
    <LearnArticle slug="what-is-the-mempool">
      <p>{t.rich("whatIsTheMempool.intro", PROSE_TAGS)}</p>
      <h2>{t("whatIsTheMempool.bundlesTitle")}</h2>
      <p>{t.rich("whatIsTheMempool.bundles", PROSE_TAGS)}</p>
      <h2>{t("whatIsTheMempool.fillTitle")}</h2>
      <p>{t.rich("whatIsTheMempool.fill", { ...PROSE_TAGS, dashboard: linkTag(routes.home()) })}</p>
      <h2>{t("whatIsTheMempool.feesTitle")}</h2>
      <p>{t.rich("whatIsTheMempool.fees", { ...PROSE_TAGS, fees: linkTag(routes.fees()) })}</p>
      <h2>{t("whatIsTheMempool.leavingTitle")}</h2>
      <p>{t.rich("whatIsTheMempool.leaving", PROSE_TAGS)}</p>
      <h2>{t("whatIsTheMempool.graphsTitle")}</h2>
      <ul>
        <li>{t.rich("whatIsTheMempool.graphsCost", PROSE_TAGS)}</li>
        <li>{t.rich("whatIsTheMempool.graphsIncoming", PROSE_TAGS)}</li>
        <li>{t.rich("whatIsTheMempool.graphsProjected", PROSE_TAGS)}</li>
      </ul>
    </LearnArticle>
  );
}
