"use client";

import { useQueries, useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import { holdingsFromBalances, type Holding } from "@/shared/lib/portfolio/valuation";
import type { CatBalance, XchBalance } from "@/shared/lib/rpc/types";
import {
  deriveAssets,
  fetchAssetBalance,
  fetchWalletTransactionsPage,
  type WalletAsset,
  type WalletAssetBalance,
  type WalletTx,
} from "@/shared/lib/sage/wallet";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** Sage history pages read to find every asset the wallet ever held (100 each, local calls). */
const SAGE_TX_PAGE = 100;
const SAGE_MAX_PAGES = 20;
export const SAGE_READ_LIMIT = SAGE_TX_PAGE * SAGE_MAX_PAGES;

/**
 * One source's holdings: `undefined` while loading, `null` when nothing could be read (failed,
 * or the node has no indexed API). `failed` flags a source that answered only in part.
 */
export interface SourceState {
  holdings: Holding[] | null | undefined;
  failed: boolean;
  /** Sage only: the history walk stopped early, so an old token may be missing. */
  partial?: boolean;
}

type PortfolioAsset = WalletAsset & { kind: "xch" | "cat" };

/**
 * Every XCH/CAT asset the wallet ever touched. Sage has no call that lists a wallet's CATs, so
 * the transaction history is read, newest first, up to SAGE_READ_LIMIT transactions.
 */
async function discoverSageAssets(): Promise<{ assets: PortfolioAsset[]; partial: boolean }> {
  const txs: WalletTx[] = [];
  let total = 0;
  let partial = false;
  for (let page = 0; page < SAGE_MAX_PAGES; page++) {
    const result = await fetchWalletTransactionsPage(page * SAGE_TX_PAGE, SAGE_TX_PAGE);
    if (page === 0) total = result.total;
    txs.push(...result.items);
    if (txs.length >= total) break;
    // A failed page reads as empty (fetchWalletTransactionsPage swallows errors): keep what
    // arrived and say the list may be incomplete rather than looking like a smaller wallet.
    if (result.items.length === 0) {
      partial = true;
      break;
    }
  }
  const assets = deriveAssets(txs).filter(
    (a): a is PortfolioAsset => a.kind === "xch" || a.kind === "cat"
  );
  return { assets, partial: partial || txs.length < total };
}

/**
 * The Sage wallet's XCH and CAT balances. Finding the assets walks the history, so it runs once
 * and stays fresh for five minutes; the balances refresh every 30 seconds and share their cache
 * with the wallet page's asset tiles.
 */
export function useSageHoldings(enabled: boolean): SourceState {
  const { networkConfig } = useSettings();
  const discovery = useQuery({
    queryKey: ["sagePortfolioAssets", networkConfig.id],
    queryFn: discoverSageAssets,
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const assets = discovery.data?.assets;
  const partial = discovery.data?.partial ?? false;
  const discoveryFailed = discovery.isError;
  const combine = useCallback(
    (results: UseQueryResult<WalletAssetBalance | null>[]): SourceState => {
      if (!enabled) return { holdings: [], failed: false };
      if (discoveryFailed) return { holdings: null, failed: true };
      if (!assets || results.some((r) => r.isPending))
        return { holdings: undefined, failed: false };
      const holdings: Holding[] = [];
      let failed = false;
      assets.forEach((a, i) => {
        const balance = results[i]?.data;
        // null: Sage refused or failed the call; the asset is missing, so the total is too low.
        if (!balance) {
          failed = true;
          return;
        }
        holdings.push({
          kind: a.kind,
          assetId: a.assetId,
          amount: balance.confirmed,
          precision: a.kind === "xch" ? 12 : a.precision || 3,
          name: a.name,
          ticker: a.ticker,
          iconUrl: a.iconUrl,
        });
      });
      return { holdings: failed && holdings.length === 0 ? null : holdings, failed, partial };
    },
    [enabled, discoveryFailed, assets, partial]
  );
  return useQueries({
    queries: (assets ?? []).map((a) => ({
      // Same key and fetcher as the wallet page's asset tiles.
      queryKey: ["sageAssetBalance", a.kind, a.assetId ?? "xch"],
      queryFn: () => fetchAssetBalance(a.kind, a.assetId),
      staleTime: 30_000,
      refetchInterval: 30_000,
    })),
    combine,
  });
}

/** XCH and CAT balances of addresses (puzzle hashes) from Coinset's indexed API. */
export function useAddressHoldings(puzzleHashes: string[]) {
  const { client, endpoints } = useSettings();
  const network = endpoints.network;
  const indexed = client.hasIndexed;
  // TanStack Query reuses the combined result while the query results and this function stay
  // the same, so the portfolio is only revalued when a balance actually changes.
  const combine = useCallback(
    (results: UseQueryResult<XchBalance | CatBalance[]>[]): SourceState[] =>
      puzzleHashes.map((_, i) => {
        if (!indexed) return { holdings: null, failed: false };
        const xch = results[i * 2];
        const cats = results[i * 2 + 1];
        // Ready only once both parts settled, so a total never shows XCH without the CATs.
        if (!xch || !cats || xch.isPending || cats.isPending)
          return { holdings: undefined, failed: false };
        const failed = xch.isError || cats.isError;
        if (xch.isError && cats.isError) return { holdings: null, failed };
        return {
          holdings: holdingsFromBalances(
            xch.data as XchBalance | undefined,
            cats.data as CatBalance[] | undefined
          ),
          failed,
        };
      }),
    [puzzleHashes, indexed]
  );
  const sources = useQueries({
    queries: puzzleHashes.flatMap((ph) => [
      {
        queryKey: queryKeys.address(network, ph, "xch"),
        queryFn: ({ signal }: { signal: AbortSignal }): Promise<XchBalance | CatBalance[]> =>
          client.getXchBalanceByP2(ph, signal),
        enabled: indexed,
        refetchInterval: 30_000,
      },
      {
        queryKey: queryKeys.address(network, ph, "cats"),
        queryFn: ({ signal }: { signal: AbortSignal }): Promise<XchBalance | CatBalance[]> =>
          client.getCatBalancesByP2(ph, signal),
        enabled: indexed,
      },
    ]),
    combine,
  });
  return { indexed, sources };
}
