"use client";

import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import type { NetworkId } from "@/shared/config/networks";
import { CHIA } from "@/shared/config/networks";
import { compactMempoolItem } from "@/shared/lib/mempool/compact";
import { packProjectedBlocks, type ProjectedBlock } from "@/shared/lib/mempool/packing";
import { loadSnapshot, saveSnapshot, SNAPSHOT_MIN_GAP_MS } from "@/shared/lib/mempool/snapshot";
import { createMempoolItemSync, type MempoolItemSync } from "@/shared/lib/mempool/sync";
import type { CompactMempoolItem, MempoolSummary } from "@/shared/lib/mempool/types";
import { parseJsonSafe } from "@/shared/lib/rpc/json";
import type { BlockchainState, BlockRecord } from "@/shared/lib/rpc/types";
import type { RpcClient } from "@/shared/lib/rpc/client";
import { useLiveValue } from "@/shared/providers/LiveProvider";
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

function browserStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * One incremental sync per network, persisting for the tab's lifetime: get_all_mempool_items
 * carries full puzzle reveals and can be tens of MB, so this fetches the id list and only the
 * items not already known instead, and keeps the compact form only
 * (src/shared/lib/mempool/sync.ts). Seeded from the last visit's snapshot so a reload does not
 * download the whole mempool again.
 */
const mempoolSyncs = new WeakMap<RpcClient, MempoolItemSync<CompactMempoolItem>>();
function getMempoolSync(
  network: NetworkId,
  client: RpcClient
): MempoolItemSync<CompactMempoolItem> {
  let sync = mempoolSyncs.get(client);
  if (!sync) {
    const snapshot = loadSnapshot(browserStorage(), network);
    sync = createMempoolItemSync({
      getAllMempoolTxIds: (s) => client.getAllMempoolTxIds(s),
      getMempoolItemByTxId: (id, s) => client.getMempoolItemByTxId(id, s),
      reduce: compactMempoolItem,
      seed: snapshot?.items.map((item) => [item.id, item] as const),
    });
    mempoolSyncs.set(client, sync);
  }
  return sync;
}

const snapshotSavedAt = new Map<NetworkId, number>();
function saveSnapshotThrottled(summary: MempoolSummary, network: NetworkId) {
  if (summary.generatedAt - (snapshotSavedAt.get(network) ?? 0) < SNAPSHOT_MIN_GAP_MS) return;
  snapshotSavedAt.set(network, summary.generatedAt);
  saveSnapshot(browserStorage(), summary);
}

function toSummary(
  network: NetworkId,
  state: BlockchainState,
  items: CompactMempoolItem[],
  source: MempoolSummary["source"]
): MempoolSummary {
  return {
    network,
    generatedAt: Date.now(),
    source,
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
      // mempool_min_fees.cost_5000000 is already a fee rate (mojos per cost).
      minFeeRate: state.mempoolMinFees.cost_5000000 ?? 0,
      synced: state.synced,
    },
    items,
  };
}

/** Compact mempool, synced incrementally in the browser (see getMempoolSync above). */
export function useMempoolSummary() {
  const { client, endpoints, hydrated } = useSettings();
  const queryClient = useQueryClient();
  const network = endpoints.network;
  // Paint the last visit's mempool at once; the first sync replaces it a moment later. Done in
  // an effect (not initialData) so the hydration render matches the prerendered page.
  useEffect(() => {
    if (!hydrated) return;
    const key = queryKeys.mempoolSummary(network, "browser");
    if (queryClient.getQueryData(key)) return;
    const snapshot = loadSnapshot(browserStorage(), network);
    if (snapshot) {
      queryClient.setQueryData(
        key,
        { ...snapshot, source: "snapshot" },
        { updatedAt: snapshot.generatedAt }
      );
    }
  }, [hydrated, network, queryClient]);
  return useQuery({
    queryKey: queryKeys.mempoolSummary(network, "browser"),
    enabled: hydrated,
    queryFn: async ({ signal }): Promise<MempoolSummary> => {
      const key = queryKeys.mempoolSummary(network, "browser");
      const statePromise = client.getBlockchainState(signal);
      let state: BlockchainState | null = null;
      void statePromise.then(
        (s) => (state = s),
        () => undefined
      );
      // A cold tab has every pending bundle to fetch; show what has arrived so far instead
      // of nothing until the last one is in.
      const items = await getMempoolSync(network, client).sync(signal, (partial) => {
        if (!state || signal.aborted) return;
        const soFar = toSummary(network, state, partial, "syncing");
        queryClient.setQueryData(key, soFar);
        // Worth keeping even if the tab closes before the sync completes: it is only a seed.
        saveSnapshotThrottled(soFar, network);
      });
      const summary = toSummary(network, await statePromise, items, "browser");
      saveSnapshotThrottled(summary, endpoints.network);
      return summary;
    },
    // Peak/transaction events from LiveProvider already invalidate this on activity; the
    // interval is a safety net only.
    refetchInterval: 20_000,
    placeholderData: keepPreviousData,
  });
}

/**
 * Several dashboard widgets project blocks from the same summary; structural sharing keeps the
 * `items` array identical while the mempool is unchanged, so pack once per array and hand every
 * caller the same blocks (which also keeps their memoised layouts valid).
 */
const packedByItems = new WeakMap<
  CompactMempoolItem[],
  Map<number, { options: string; blocks: ProjectedBlock[] }>
>();
function packShared(summary: MempoolSummary, maxBlocks: number): ProjectedBlock[] {
  const blockMaxCost = summary.state.blockMaxCost || CHIA.BLOCK_MAX_COST;
  const averageBlockTime = summary.state.averageBlockTime || CHIA.TARGET_BLOCK_TIME_S;
  const options = `${blockMaxCost}:${averageBlockTime}`;
  let byMaxBlocks = packedByItems.get(summary.items);
  if (!byMaxBlocks) {
    byMaxBlocks = new Map();
    packedByItems.set(summary.items, byMaxBlocks);
  }
  const cached = byMaxBlocks.get(maxBlocks);
  if (cached?.options === options) return cached.blocks;
  const blocks = packProjectedBlocks(summary.items, {
    blockMaxCost,
    averageBlockTime,
    txBlockRatio: CHIA.TX_BLOCK_RATIO,
    maxBlocks,
  });
  byMaxBlocks.set(maxBlocks, { options, blocks });
  return blocks;
}

export function useProjectedBlocks(maxBlocks = 8): {
  blocks: ProjectedBlock[];
  summary: MempoolSummary | undefined;
  isLoading: boolean;
  error: unknown;
} {
  const query = useMempoolSummary();
  const blocks = useMemo(
    () => (query.data ? packShared(query.data, maxBlocks) : []),
    [query.data, maxBlocks]
  );
  return { blocks, summary: query.data, isLoading: query.isLoading, error: query.error };
}

/**
 * Lists already hold the records the block page paints on: put them in the cache under the
 * block page's keys (height and header hash) so opening a block from a list shows at once.
 */
export function seedBlockRecords(
  queryClient: QueryClient,
  network: NetworkId,
  records: BlockRecord[]
): void {
  records.forEach((record) => {
    [String(record.height), record.headerHash.toLowerCase()].forEach((id) => {
      const key = queryKeys.blockRecord(network, id);
      if (queryClient.getQueryData(key) === undefined) queryClient.setQueryData(key, record);
    });
  });
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
  const queryClient = useQueryClient();
  const state = useBlockchainState();
  const peakHeight = useLiveValue("peakHeight");
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  return useQuery({
    queryKey: queryKeys.recentBlocks(endpoints.network, count, peak),
    enabled: hydrated && peak !== null,
    placeholderData: keepPreviousData,
    // The peak is part of the key, so every new block leaves an entry behind: drop it soon.
    gcTime: 30_000,
    queryFn: async ({ signal }): Promise<RecentBlocksResult> => {
      const end = (peak ?? 0) + 1;
      const window = Math.max(20, Math.ceil(count / CHIA.TX_BLOCK_RATIO) + 10);
      const records = await client.getBlockRecords(Math.max(0, end - window), end, signal);
      const all = [...records].sort((a, b) => b.height - a.height);
      const txBlocks = all.filter((r) => r.isTransactionBlock).slice(0, count);
      seedBlockRecords(queryClient, endpoints.network, txBlocks);
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
