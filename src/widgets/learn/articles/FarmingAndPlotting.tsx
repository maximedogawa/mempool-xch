"use client";

import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "../LearnArticle";
import { linkTag, PROSE_TAGS } from "./tags";
import learnNs from "@/shared/i18n/messages/en/learn";

export function FarmingAndPlotting() {
  const t = useT(learnNs);
  return (
    <LearnArticle slug="farming-and-plotting">
      <h2>{t("farmingAndPlotting.plottingTitle")}</h2>
      <p>{t.rich("farmingAndPlotting.plotting", PROSE_TAGS)}</p>
      <h2>{t("farmingAndPlotting.farmingTitle")}</h2>
      <p>
        {t.rich("farmingAndPlotting.farming", {
          ...PROSE_TAGS,
          settings: linkTag(routes.settings()),
        })}
      </p>
      <h2>{t("farmingAndPlotting.rewardsTitle")}</h2>
      <p>
        {t.rich("farmingAndPlotting.rewards", {
          ...PROSE_TAGS,
          blocks: linkTag(routes.blocks()),
          pools: linkTag(routes.pools()),
        })}
      </p>
      <h2>{t("farmingAndPlotting.poolsTitle")}</h2>
      <p>{t.rich("farmingAndPlotting.pools", PROSE_TAGS)}</p>
      <h2>{t("farmingAndPlotting.hereTitle")}</h2>
      <ul>
        <li>{t.rich("farmingAndPlotting.hereNetspace", { dashboard: linkTag(routes.home()) })}</li>
        <li>{t.rich("farmingAndPlotting.herePools", { pools: linkTag(routes.pools()) })}</li>
        <li>{t.rich("farmingAndPlotting.hereMap", { map: linkTag(routes.map()) })}</li>
      </ul>
    </LearnArticle>
  );
}
