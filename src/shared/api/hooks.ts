"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { NetworkId } from "@/shared/config/networks";
import { CHIA } from "@/shared/config/networks";
import { compactMempoolItem } from "@/shared/lib/mempool/compact";
import { packProjectedBlocks, type ProjectedBlock } from "@/shared/lib/mempool/packing";
import { createMempoolItemSync, type MempoolItemSync } from "@/shared/lib/mempool/sync";
import type { MempoolSummary } from "@/shared/lib/mempool/types";
import { parseJsonSafe } from "@/shared/lib/rpc/json";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import type { RpcClient } from "@/shared/lib/rpc/client";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { queryKeys } from "./queryKeys";

export function useBlockchainState() {
  const { client, endpoints, hydrated } = useSettings();
  return useQuery({
    queryKey: queryKeys.state(endpoints.network),
    enabled: hydrated,
    queryFn: ({ signal }) => client.getBlockchainState(signal),
    // LiveProvider's poll already refreshes this cache entry; this is a safety net only.
    refetchInterval: 60_000,
  });
}

/**
 * One incremental sync per network, persisting for the tab's lifetime: get_all_mempool_items
 * carries full puzzle reveals and can be tens of MB, so this fetches the id list and only the
 * items not already known instead (src/shared/lib/mempool/sync.ts).
 */
const mempoolSyncs = new Map<NetworkId, MempoolItemSync>();
function getMempoolSync(network: NetworkId, client: RpcClient): MempoolItemSync {
  let sync = mempoolSyncs.get(network);
  if (!sync) {
    sync = createMempoolItemSync({
      getAllMempoolTxIds: (s) => client.getAllMempoolTxIds(s),
      getMempoolItemByTxId: (id, s) => client.getMempoolItemByTxId(id, s),
    });
    mempoolSyncs.set(network, sync);
  }
  return sync;
}

/** Compact mempool, synced incrementally in the browser (see getMempoolSync above). */
export function useMempoolSummary() {
  const { client, endpoints, hydrated } = useSettings();
  return useQuery({
    queryKey: queryKeys.mempoolSummary(endpoints.network, "browser"),
    enabled: hydrated,
    queryFn: async ({ signal }): Promise<MempoolSummary> => {
      const [state, entries] = await Promise.all([
        client.getBlockchainState(signal),
        getMempoolSync(endpoints.network, client).sync(signal),
      ]);
      const now = Date.now();
      const compact = entries.map(({ item, firstSeen }) => compactMempoolItem(item, firstSeen));
      // mempool_min_fees.cost_5000000 is already a fee rate (mojos per cost).
      const minFeeRate = state.mempoolMinFees.cost_5000000 ?? 0;
      return {
        network: endpoints.network,
        generatedAt: now,
        source: "browser",
        state: {
          peakHeight: state.peak.height,
          peakHash: state.peak.headerHash,
          lastTxBlockHeight: state.peak.isTransactionBlock
            ? state.peak.height
            : state.peak.prevTransactionBlockHeight,
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
    // Peak/transaction events from LiveProvider already invalidate this on activity; the
    // interval is a safety net only.
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
  });
}

export function useProjectedBlocks(maxBlocks = 8): {
  blocks: ProjectedBlock[];
  summary: MempoolSummary | undefined;
  isLoading: boolean;
  error: unknown;
} {
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
  const { client, endpoints, hydrated } = useSettings();
  const state = useBlockchainState();
  const { peakHeight } = useLive();
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  return useQuery({
    queryKey: queryKeys.recentBlocks(endpoints.network, count, peak),
    enabled: hydrated && peak !== null,
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
  const { client, endpoints, hydrated } = useSettings();
  return useQuery({
    queryKey: [...queryKeys.fee(endpoints.network), cost],
    enabled: hydrated,
    queryFn: ({ signal }) => client.getFeeEstimate(cost, [...FEE_TARGETS_S], signal),
    refetchInterval: 45_000,
    placeholderData: keepPreviousData,
  });
}

export { parseJsonSafe };
