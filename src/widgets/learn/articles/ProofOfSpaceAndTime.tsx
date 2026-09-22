"use client";

import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "../LearnArticle";
import { linkTag, PROSE_TAGS } from "./tags";

export function ProofOfSpaceAndTime() {
  const t = useT("learn");
  return (
    <LearnArticle slug="proof-of-space-and-time">
      <p>{t.rich("proofOfSpaceAndTime.intro", PROSE_TAGS)}</p>
      <h2>{t("proofOfSpaceAndTime.spaceTitle")}</h2>
      <p>
        {t.rich("proofOfSpaceAndTime.space", { ...PROSE_TAGS, dashboard: linkTag(routes.home()) })}
      </p>
      <h2>{t("proofOfSpaceAndTime.timeTitle")}</h2>
      <p>{t.rich("proofOfSpaceAndTime.time", PROSE_TAGS)}</p>
      <h2>{t("proofOfSpaceAndTime.signageTitle")}</h2>
      <p>
        {t.rich("proofOfSpaceAndTime.signage", { ...PROSE_TAGS, blocks: linkTag(routes.blocks()) })}
      </p>
      <h2>{t("proofOfSpaceAndTime.youTitle")}</h2>
      <p>
        {t.rich("proofOfSpaceAndTime.you", {
          ...PROSE_TAGS,
          mempool: linkTag(routes.learnArticle("what-is-the-mempool")),
        })}
      </p>
    </LearnArticle>
  );
}
