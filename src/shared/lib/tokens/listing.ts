/**
 * Filtering and ordering for the tokens page. Most registered CATs are dormant (2026-09-20: of
 * 943 on Dexie, 111 traded within 30 days and 141 had open liquidity), so the filters are about
 * market presence, and every ranking is in XCH so tokens compare with each other.
 */
import type { TokenInfo } from "@/shared/api/tokenList";
import type { TokenMarket, TokenMarketMap, VolumeWindow } from "./markets";

export type TokenFilter = "traded" | "liquid" | "priced" | "all";
export type TokenSort = "volume" | "liquidity" | "price" | "name";

export interface TokenRow {
  token: TokenInfo;
  market: TokenMarket | null;
  liquidityXch: number;
}

export function buildTokenRows(tokens: TokenInfo[], markets: TokenMarketMap): TokenRow[] {
  return tokens.map((token) => ({
    token,
    market: markets[token.assetId] ?? null,
    liquidityXch: token.liquidityXch ?? 0,
  }));
}

export function matchesFilter(row: TokenRow, filter: TokenFilter, window: VolumeWindow): boolean {
  switch (filter) {
    case "traded":
      return (row.market?.volumeXch[window] ?? 0) > 0;
    case "liquid":
      return row.liquidityXch > 0;
    case "priced":
      return row.market?.lastPriceXch != null;
    case "all":
      return true;
  }
}

export function matchesSearch(token: TokenInfo, query: string): boolean {
  const q = query.trim().toLowerCase();
  return (
    !q ||
    token.name.toLowerCase().includes(q) ||
    token.symbol.toLowerCase().includes(q) ||
    token.assetId.includes(q.replace(/^0x/, ""))
  );
}

function score(row: TokenRow, sort: TokenSort, window: VolumeWindow): number {
  if (sort === "volume") return row.market?.volumeXch[window] ?? 0;
  if (sort === "liquidity") return row.liquidityXch;
  if (sort === "price") return row.market?.lastPriceXch ?? 0;
  return 0;
}

/** Highest first; ties (and the name sort) fall back to the name so the order is stable. */
export function listTokens(
  rows: TokenRow[],
  opts: { filter: TokenFilter; sort: TokenSort; window: VolumeWindow; search: string }
): TokenRow[] {
  return rows
    .filter(
      (row) => matchesFilter(row, opts.filter, opts.window) && matchesSearch(row.token, opts.search)
    )
    .sort(
      (a, b) =>
        score(b, opts.sort, opts.window) - score(a, opts.sort, opts.window) ||
        a.token.name.localeCompare(b.token.name)
    );
}

export function countByFilter(rows: TokenRow[], window: VolumeWindow): Record<TokenFilter, number> {
  const counts: Record<TokenFilter, number> = { traded: 0, liquid: 0, priced: 0, all: 0 };
  rows.forEach((row) => {
    (Object.keys(counts) as TokenFilter[]).forEach((f) => {
      if (matchesFilter(row, f, window)) counts[f] += 1;
    });
  });
  return counts;
}
