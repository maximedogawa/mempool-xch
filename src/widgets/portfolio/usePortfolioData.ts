"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import type { Holding } from "@/shared/lib/portfolio/valuation";
import {
  deriveAssets,
  fetchAssetBalance,
  fetchWalletTransactionsPage,
  type WalletTx,
} from "@/shared/lib/sage/wallet";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** Sage history pages read to find every asset the wallet ever held (100 each, local calls). */
const SAGE_TX_PAGE = 100;
const SAGE_MAX_PAGES = 20;
export const SAGE_READ_LIMIT = SAGE_TX_PAGE * SAGE_MAX_PAGES;

export interface SourceHoldings {
  holdings: Holding[];
  /** The history was cut at SAGE_MAX_PAGES, so an old token could be missing. */
  partial: boolean;
}

/** The Sage wallet's XCH and CAT balances; assets come from the whole transaction history. */
export function useSageHoldings(enabled: boolean) {
  const { networkConfig } = useSettings();
  return useQuery<SourceHoldings>({
    queryKey: ["sagePortfolio", networkConfig.id],
    enabled,
    refetchInterval: 30_000,
    queryFn: async () => {
      const txs: WalletTx[] = [];
      let total = 0;
      let pages = 0;
      for (; pages < SAGE_MAX_PAGES; pages++) {
        const page = await fetchWalletTransactionsPage(pages * SAGE_TX_PAGE, SAGE_TX_PAGE);
        total = page.total;
        txs.push(...page.items);
        if (page.items.length === 0 || txs.length >= total) break;
      }
      const assets = deriveAssets(txs).filter(
        (a): a is typeof a & { kind: "xch" | "cat" } => a.kind === "xch" || a.kind === "cat"
      );
      const balances = await Promise.all(assets.map((a) => fetchAssetBalance(a.kind, a.assetId)));
      const holdings: Holding[] = assets.flatMap((a, i) => {
        const b = balances[i];
        return b
          ? [
              {
                kind: a.kind,
                assetId: a.assetId,
                amount: b.confirmed,
                precision: a.kind === "xch" ? 12 : a.precision || 3,
                name: a.name,
                ticker: a.ticker,
                iconUrl: a.iconUrl,
              },
            ]
          : [];
      });
      return { holdings, partial: txs.length < total };
    },
  });
}

/** XCH and CAT balances of addresses (puzzle hashes) from Coinset's indexed API. */
export function useAddressHoldings(puzzleHashes: string[]) {
  const { client, endpoints } = useSettings();
  const network = endpoints.network;
  const indexed = client.hasIndexed;
  const results = useQueries({
    queries: puzzleHashes.flatMap((ph) => [
      {
        queryKey: queryKeys.address(network, ph, "xch"),
        queryFn: ({ signal }: { signal: AbortSignal }) => client.getXchBalanceByP2(ph, signal),
        enabled: indexed,
        refetchInterval: 30_000,
      },
      {
        queryKey: queryKeys.address(network, ph, "cats"),
        queryFn: ({ signal }: { signal: AbortSignal }) => client.getCatBalancesByP2(ph, signal),
        enabled: indexed,
      },
    ]),
  });
  // Cheap to rebuild each render: a few balances per address.
  const data = puzzleHashes.map((_, i): Holding[] | undefined => {
    const xch = results[i * 2]?.data as { confirmed: bigint } | undefined;
    const cats = results[i * 2 + 1]?.data as { assetId: string; confirmed: bigint }[] | undefined;
    if (!xch && !cats) return undefined;
    return [
      ...(xch
        ? [{ kind: "xch" as const, assetId: null, amount: xch.confirmed, precision: 12 }]
        : []),
      ...(cats ?? []).map((c) => ({
        kind: "cat" as const,
        assetId: c.assetId,
        amount: c.confirmed,
        precision: 3,
      })),
    ];
  });
  return {
    indexed,
    data,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
  };
}
