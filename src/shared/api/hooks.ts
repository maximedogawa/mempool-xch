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
import { useLiveValue, useMeteredLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { recentWindow, type RecentBlocksResult } from "@/shared/lib/blocks/recent";
import { queryKeys } from "./queryKeys";

export function useBlockchainState() {
  const { client, endpoints, hydrated } = useSettings();
  const meteredLive = useMeteredLive();
  return useQuery({
    queryKey: queryKeys.state(endpoints.network),
    enabled: hydrated,
    queryFn: ({ signal }) => client.getBlockchainState(signal),
    // LiveProvider's poll already refreshes this cache entry; this is a safety net only.
    refetchInterval: meteredLive ? false : 60_000,
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
      // A nodexch gateway counts requests and serves the listing from its loop's cache; on
      // Coinset and custom nodes the listing is tens of MB of fresh node work, so not there.
      getAllMempoolItems: client.metered ? (s) => client.getAllMempoolItems(s) : undefined,
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

/**
 * A nodexch gateway older than `/x/node/v1/mempool/items` answers 404: it is asked again after
 * this, not on every sync or reload (remembered in localStorage, per gateway).
 */
const GATEWAY_ITEMS_RETRY_MS = 60 * 60_000;
const GATEWAY_ITEMS_OFF_KEY = "mempool-xch:nodexch-mempool-items-off:v1";

function gatewayItemsOff(client: RpcClient): boolean {
  if (!client.metered) return true;
  try {
    const raw = JSON.parse(browserStorage()?.getItem(GATEWAY_ITEMS_OFF_KEY) ?? "null") as {
      url?: unknown;
      until?: unknown;
    } | null;
    return raw?.url === client.rpcUrl && typeof raw.until === "number" && Date.now() < raw.until;
  } catch {
    return false;
  }
}

function markGatewayItemsOff(client: RpcClient): void {
  if (!client.metered) return;
  try {
    browserStorage()?.setItem(
      GATEWAY_ITEMS_OFF_KEY,
      JSON.stringify({ url: client.rpcUrl, until: Date.now() + GATEWAY_ITEMS_RETRY_MS })
    );
  } catch {
    // Without storage the gateway is simply asked again on the next sync.
  }
}
/** With a live nodexch socket the deltas carry every change: a full read is only a check. */
const METERED_MEMPOOL_RESYNC_MS = 5 * 60_000;

/** As old as the poll lets the state get anyway (LiveProvider polls every 5 to 15 s). */
const STATE_REUSE_MS = 15_000;

/** Compact mempool, synced incrementally in the browser (see getMempoolSync above). */
export function useMempoolSummary() {
  const { client, endpoints, hydrated } = useSettings();
  const queryClient = useQueryClient();
  const meteredLive = useMeteredLive();
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
      // The state the poll, the socket or the state query already holds, when it is recent:
      // a sync runs every few seconds on a busy mempool and need not ask for it each time.
      const statePromise = queryClient.fetchQuery({
        queryKey: queryKeys.state(network),
        // Its own signal: the state query is shared, a cancelled sync must not fail it.
        queryFn: ({ signal: stateSignal }) => client.getBlockchainState(stateSignal),
        staleTime: STATE_REUSE_MS,
      });
      let state: BlockchainState | null = null;
      void statePromise.then(
        (s) => (state = s),
        () => undefined
      );
      // A cold tab has every pending bundle to fetch; show what has arrived so far instead
      // of nothing until the last one is in.
      // A nodexch gateway hands the whole mempool over in one call, and its socket's deltas
      // then keep it current (LiveProvider), so nothing is asked per transaction.
      const fromGateway = gatewayItemsOff(client) ? null : await client.getMempoolItems(signal);
      if (fromGateway) {
        const summary = toSummary(network, await statePromise, fromGateway, "browser");
        saveSnapshotThrottled(summary, network);
        return summary;
      }
      markGatewayItemsOff(client);
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
    refetchInterval: meteredLive ? METERED_MEMPOOL_RESYNC_MS : 20_000,
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

export type { RecentBlocksResult };

/** The last `count` transaction blocks (plus the non-transaction blocks between them). */
export function useRecentBlocks(count: number) {
  const { client, endpoints, hydrated } = useSettings();
  const queryClient = useQueryClient();
  const state = useBlockchainState();
  const peakHeight = useLiveValue("peakHeight");
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  // A metered gateway's window has one key: LiveProvider asks for it again only on a
  // transaction block, or adds the blocks its socket pushes (the window still ends at the peak).
  const keyPeak = endpoints.provider === "nodexch" ? "live" : peak;
  return useQuery({
    queryKey: queryKeys.recentBlocks(endpoints.network, count, keyPeak),
    enabled: hydrated && peak !== null,
    placeholderData: keepPreviousData,
    // On other providers the peak is part of the key, so every new block leaves an entry
    // behind: drop it soon.
    gcTime: 30_000,
    queryFn: async ({ signal }): Promise<RecentBlocksResult> => {
      const end = (peak ?? 0) + 1;
      const window = Math.max(20, Math.ceil(count / CHIA.TX_BLOCK_RATIO) + 10);
      const records = await client.getBlockRecords(Math.max(0, end - window), end, signal);
      const result = recentWindow(records, count);
      seedBlockRecords(queryClient, endpoints.network, result.txBlocks);
      return result;
    },
  });
}

export const FEE_TARGETS_S = [60, 300, 600] as const;

export function useFeeEstimate(cost = CHIA.REFERENCE_SPEND_COST) {
  const { client, endpoints, hydrated } = useSettings();
  const meteredLive = useMeteredLive();
  return useQuery({
    queryKey: [...queryKeys.fee(endpoints.network), cost],
    enabled: hydrated,
    queryFn: ({ signal }) => client.getFeeEstimate(cost, [...FEE_TARGETS_S], signal),
    refetchInterval: meteredLive ? false : 45_000,
    placeholderData: keepPreviousData,
  });
}

export { parseJsonSafe };
