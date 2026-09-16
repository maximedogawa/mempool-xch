"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { CHIA } from "@/shared/config/networks";
import { compactMempoolItem } from "@/shared/lib/mempool/compact";
import { packProjectedBlocks, type ProjectedBlock } from "@/shared/lib/mempool/packing";
import type { MempoolSummary } from "@/shared/lib/mempool/types";
import { parseJsonSafe } from "@/shared/lib/rpc/json";
import { RpcError } from "@/shared/lib/rpc/errors";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { queryKeys } from "./queryKeys";

export function useBlockchainState() {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: queryKeys.state(endpoints.network),
    queryFn: ({ signal }) => client.getBlockchainState(signal),
    // LiveProvider's poll already refreshes this cache entry; this is a safety net only.
    refetchInterval: 60_000,
  });
}

/** First-seen times for the browser fallback survive across refetches within the session. */
const browserFirstSeen = new Map<string, number>();

async function fetchSummaryFromServer(url: string, signal: AbortSignal): Promise<MempoolSummary> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new RpcError("http", "summary", `Summary API answered ${response.status}`, { status: response.status });
  const text = await response.text();
  try {
    return JSON.parse(text) as MempoolSummary;
  } catch (error) {
    throw new RpcError("malformed", "summary", "Malformed summary", { detail: error });
  }
}

/**
 * Compact mempool: from the hosted summary API when the endpoint is Coinset, otherwise
 * assembled in the browser from get_all_mempool_items (heavy, but only for custom nodes).
 */
export function useMempoolSummary() {
  const { client, endpoints } = useSettings();
  const { status } = useLive();
  const source = endpoints.summaryUrl ?? "browser";
  // With a live WebSocket, transaction and peak events already invalidate the summary, so the
  // interval is only a safety net; while polling it carries the updates itself.
  const interval = endpoints.summaryUrl ? (status === "live" ? 12_000 : 4_000) : 20_000;
  return useQuery({
    queryKey: queryKeys.mempoolSummary(endpoints.network, source),
    queryFn: async ({ signal }): Promise<MempoolSummary> => {
      if (endpoints.summaryUrl) {
        try {
          return await fetchSummaryFromServer(endpoints.summaryUrl, signal);
        } catch (error) {
          // The static Sage snapshot or a dev server without the API falls back to the browser.
          if (!(error instanceof RpcError && (error.kind === "http" || error.kind === "network"))) throw error;
        }
      }
      const [state, items] = await Promise.all([client.getBlockchainState(signal), client.getAllMempoolItems(signal)]);
      const now = Date.now();
      const live = new Set(items.map((i) => i.name));
      [...browserFirstSeen.keys()].filter((id) => !live.has(id)).forEach((id) => browserFirstSeen.delete(id));
      const compact = items.map((item) => {
        const seen = browserFirstSeen.get(item.name) ?? now;
        browserFirstSeen.set(item.name, seen);
        return compactMempoolItem(item, seen);
      });
      // mempool_min_fees.cost_5000000 is already a fee rate (mojos per cost), see server/mempoolSummary.ts
      const minFeeRate = state.mempoolMinFees.cost_5000000 ?? 0;
      return {
        network: endpoints.network,
        generatedAt: now,
        source: "browser",
        state: {
          peakHeight: state.peak.height,
          peakHash: state.peak.headerHash,
          lastTxBlockHeight: state.peak.isTransactionBlock ? state.peak.height : state.peak.prevTransactionBlockHeight,
          mempoolSize: state.mempoolSize,
          mempoolCost: state.mempoolCost,
          mempoolMaxTotalCost: state.mempoolMaxTotalCost,
          mempoolFees: state.mempoolFees.toString(),
          blockMaxCost: state.blockMaxCost,
          averageBlockTime: state.averageBlockTime,
          minFeeRate,
          synced: state.synced,
        },
        items: compact,
      };
    },
    // While the server is still filling its view (fewer items than the node reports), poll
    // quickly so the first visitor after a restart sees projected blocks within seconds.
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && data.source === "server" && data.items.length < data.state.mempoolSize * 0.9) return 1_500;
      return interval;
    },
    placeholderData: keepPreviousData,
  });
}

export function useProjectedBlocks(maxBlocks = 8): { blocks: ProjectedBlock[]; summary: MempoolSummary | undefined; isLoading: boolean; error: unknown } {
  const query = useMempoolSummary();
  const blocks = useMemo(() => {
    if (!query.data) return [];
    return packProjectedBlocks(query.data.items, {
      blockMaxCost: query.data.state.blockMaxCost || CHIA.BLOCK_MAX_COST,
      averageBlockTime: query.data.state.averageBlockTime || CHIA.TARGET_BLOCK_TIME_S,
      txBlockRatio: CHIA.TX_BLOCK_RATIO,
      maxBlocks,
    });
  }, [query.data, maxBlocks]);
  return { blocks, summary: query.data, isLoading: query.isLoading, error: query.error };
}

export interface RecentBlocksResult {
  /** Newest first. */
  txBlocks: BlockRecord[];
  /** Every record in the window, newest first, for gap markers. */
  all: BlockRecord[];
}

/** The last `count` transaction blocks (plus the non-transaction blocks between them). */
export function useRecentBlocks(count: number) {
  const { client, endpoints } = useSettings();
  const state = useBlockchainState();
  const { peakHeight } = useLive();
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  return useQuery({
    queryKey: queryKeys.recentBlocks(endpoints.network, count, peak),
    enabled: peak !== null,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }): Promise<RecentBlocksResult> => {
      const end = (peak ?? 0) + 1;
      const window = Math.max(20, Math.ceil(count / CHIA.TX_BLOCK_RATIO) + 10);
      const records = await client.getBlockRecords(Math.max(0, end - window), end, signal);
      const all = [...records].sort((a, b) => b.height - a.height);
      const txBlocks = all.filter((r) => r.isTransactionBlock).slice(0, count);
      const oldest = txBlocks[txBlocks.length - 1]?.height ?? 0;
      return { txBlocks, all: all.filter((r) => r.height >= oldest) };
    },
  });
}

export const FEE_TARGETS_S = [60, 300, 600] as const;

export function useFeeEstimate(cost = CHIA.REFERENCE_SPEND_COST) {
  const { client, endpoints } = useSettings();
  return useQuery({
    queryKey: [...queryKeys.fee(endpoints.network), cost],
    queryFn: ({ signal }) => client.getFeeEstimate(cost, [...FEE_TARGETS_S], signal),
    refetchInterval: 45_000,
    placeholderData: keepPreviousData,
  });
}

export { parseJsonSafe };
