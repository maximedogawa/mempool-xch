import { routes } from "@/shared/lib/routes";

/** Message group in the `learn` namespace holding an article's title, summary and body. */
export type LearnArticleKey =
  | "whatIsChia"
  | "proofOfSpaceAndTime"
  | "farmingAndPlotting"
  | "whatIsTheMempool"
  | "offersAndTrading"
  | "questions";

export interface LearnArticleMeta {
  slug: string;
  /** `learn` message group: `<key>.title`, `<key>.summary`. */
  key: LearnArticleKey;
  /** Minutes to read, rounded. */
  minutes: number;
}

/** The Learn articles, in reading order; each lives at src/app/learn/<slug>/page.tsx. */
export const LEARN_ARTICLES: LearnArticleMeta[] = [
  {
    slug: "what-is-chia",
    key: "whatIsChia",
    minutes: 4,
  },
  {
    slug: "proof-of-space-and-time",
    key: "proofOfSpaceAndTime",
    minutes: 5,
  },
  {
    slug: "farming-and-plotting",
    key: "farmingAndPlotting",
    minutes: 4,
  },
  {
    slug: "what-is-the-mempool",
    key: "whatIsTheMempool",
    minutes: 5,
  },
  {
    slug: "offers-and-trading",
    key: "offersAndTrading",
    minutes: 4,
  },
  {
    slug: "questions",
    key: "questions",
    minutes: 5,
  },
];

export function learnHref(slug: string): string {
  return routes.learnArticle(slug);
}

export function articleBySlug(slug: string): LearnArticleMeta | undefined {
  return LEARN_ARTICLES.find((a) => a.slug === slug);
}
