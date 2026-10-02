/**
 * The public wiki lives in this repository under wiki/ (the separate mempool-xch-wiki repository
 * is private). Every documentation link in the app goes through wikiUrl, and
 * src/shared/config/wiki.test.ts checks that each page exists and that wiki/ links nothing
 * private.
 */
export const WIKI_BASE = "https://github.com/maximedogawa/mempool-xch/blob/main/wiki";

export const WIKI_PAGES = {
  install: "guides/install.md",
  customNode: "guides/custom-node.md",
  overview: "architecture/overview.md",
  coinsetLoad: "architecture/coinset-load.md",
  competitors: "architecture/competitors.md",
} as const;

export type WikiPage = keyof typeof WIKI_PAGES;

export function wikiUrl(page: WikiPage, anchor?: string): string {
  return `${WIKI_BASE}/${WIKI_PAGES[page]}${anchor ? `#${anchor}` : ""}`;
}
