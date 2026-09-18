import { routes } from "@/shared/lib/routes";

export interface LearnArticleMeta {
  slug: string;
  title: string;
  summary: string;
  /** Minutes to read, rounded. */
  minutes: number;
}

/** The Learn articles, in reading order; each lives at src/app/learn/<slug>/page.tsx. */
export const LEARN_ARTICLES: LearnArticleMeta[] = [
  {
    slug: "what-is-chia",
    title: "What is Chia?",
    summary:
      "A blockchain secured by disk space instead of electricity or stake, with coins that are tiny programs.",
    minutes: 4,
  },
  {
    slug: "proof-of-space-and-time",
    title: "Proof of space and time",
    summary:
      "How plots, challenges and verifiable delay functions decide who farms the next block.",
    minutes: 5,
  },
  {
    slug: "farming-and-plotting",
    title: "Farming and plotting",
    summary: "What a plot is, what a farmer does every nine seconds, and where pools fit in.",
    minutes: 4,
  },
  {
    slug: "what-is-the-mempool",
    title: "What is the mempool?",
    summary:
      "Where spend bundles wait, how the node picks them for a block, and what this site shows you about it.",
    minutes: 5,
  },
  {
    slug: "offers-and-trading",
    title: "Offers and trading",
    summary:
      "Peer-to-peer swaps of XCH, CATs and NFTs without an exchange, and how they look on chain.",
    minutes: 4,
  },
  {
    slug: "questions",
    title: "Common questions",
    summary:
      "Short answers to the things people ask most: fees, confirmations, coins, addresses and reorgs.",
    minutes: 5,
  },
];

export function learnHref(slug: string): string {
  return routes.learnArticle(slug);
}

export function articleBySlug(slug: string): LearnArticleMeta | undefined {
  return LEARN_ARTICLES.find((a) => a.slug === slug);
}
