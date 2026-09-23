"use client";

import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "../LearnArticle";
import { linkTag, PROSE_TAGS } from "./tags";

export function OffersAndTrading() {
  const t = useT("learn");
  return (
    <LearnArticle slug="offers-and-trading">
      <p>{t.rich("offersAndTrading.intro", PROSE_TAGS)}</p>
      <h2>{t("offersAndTrading.noExchangeTitle")}</h2>
      <p>{t.rich("offersAndTrading.noExchange", PROSE_TAGS)}</p>
      <h2>{t("offersAndTrading.onChainTitle")}</h2>
      <p>
        {t.rich("offersAndTrading.onChain", {
          ...PROSE_TAGS,
          mempool: linkTag(routes.mempool()),
          tokens: linkTag(routes.tokens()),
        })}
      </p>
      <h2>{t("offersAndTrading.lifecycleTitle")}</h2>
      <ul>
        <li>{t.rich("offersAndTrading.lifecycleOpen", PROSE_TAGS)}</li>
        <li>{t.rich("offersAndTrading.lifecycleTaking", PROSE_TAGS)}</li>
        <li>{t.rich("offersAndTrading.lifecycleTaken", PROSE_TAGS)}</li>
        <li>{t.rich("offersAndTrading.lifecycleCancelled", PROSE_TAGS)}</li>
      </ul>
      <h2>{t("offersAndTrading.clawbackTitle")}</h2>
      <p>
        {t.rich("offersAndTrading.clawback", {
          ...PROSE_TAGS,
          address: linkTag(routes.learnArticle("questions")),
        })}
      </p>
    </LearnArticle>
  );
}
