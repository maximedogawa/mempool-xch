"use client";

import { useT } from "@/shared/i18n/useT";
import type { RichTag } from "@/shared/i18n/translate";
import { routes } from "@/shared/lib/routes";
import { LearnArticle } from "../LearnArticle";
import { linkTag, PROSE_TAGS } from "./tags";
import learnNs from "@/shared/i18n/messages/en/learn";

type QuestionKey =
  "pending" | "fee" | "confirmations" | "ids" | "coins" | "reorg" | "data" | "prefarm";

const LINKS: Record<string, RichTag> = {
  fees: linkTag(routes.fees()),
  blocks: linkTag(routes.blocks()),
  settings: linkTag(routes.settings()),
  status: linkTag(routes.status()),
  prefarm: linkTag(routes.prefarm()),
};

const QUESTIONS: QuestionKey[] = [
  "pending",
  "fee",
  "confirmations",
  "ids",
  "coins",
  "reorg",
  "data",
  "prefarm",
];

export function Questions() {
  const t = useT(learnNs);
  return (
    <LearnArticle slug="questions">
      {QUESTIONS.map((key) => (
        <section key={key} className="flex flex-col gap-1">
          <h2>{t(`questions.${key}.q`)}</h2>
          <p>{t.rich(`questions.${key}.a`, { ...PROSE_TAGS, ...LINKS })}</p>
        </section>
      ))}
    </LearnArticle>
  );
}
