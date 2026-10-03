"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createLiveStream,
  type LiveEvent,
  type LiveStatus,
  type LiveTransport,
} from "@/shared/lib/live/stream";
import { fetchBlockchainState, seedBlockTotals } from "@/shared/api/gateway";
import { queryKeys } from "@/shared/api/queryKeys";
import { addRecentBlock, type RecentBlocksResult } from "@/shared/lib/blocks/recent";
import { applyMempoolDelta } from "@/shared/lib/mempool/delta";
import type { MempoolStateSummary, MempoolSummary } from "@/shared/lib/mempool/types";
import { feeEstimateFromQuote } from "@/shared/lib/nodexch/dashboard";
import type { BlockchainState } from "@/shared/lib/rpc/types";
import { useSettings } from "./SettingsProvider";

export interface LiveContextValue {
  status: LiveStatus;
  /** Transport the stream ended up on: the direct Coinset socket or polling. */
  transport: LiveTransport;
  /** Unix ms of the last event (peak, transaction or poll sample). */
  lastEventAt: number | null;
  peakHeight: number | null;
  /** Monotonic counter bumped on every transaction batch, for feeds that want a nudge. */
  txBatch: number;
  lastTxEvent: Extract<LiveEvent, { type: "transaction" }> | null;
  /** Latest netspace estimate pushed by Coinset (null on custom nodes and before the first frame). */
  netspace: { bytes: bigint; difficulty: number; at: number } | null;
  /** Most recent reorg seen on this connection; null until one happens. */
  lastReorg: Extract<LiveEvent, { type: "reorg" }> | null;
  /** Most recent Chia Vault recovery event on this connection. */
  lastVault: Extract<LiveEvent, { type: "vault" }> | null;
}

const INITIAL: LiveContextValue = {
  status: "offline",
  transport: "polling",
  lastEventAt: null,
  peakHeight: null,
  txBatch: 0,
  lastTxEvent: null,
  netspace: null,
  lastReorg: null,
  lastVault: null,
};

/**
 * The live state is an external store rather than context state: Coinset sends several events
 * per second when the mempool is busy and each one moves `lastEventAt`, so with one context
 * value every consumer (the whole blocks row, the wallet panel, ...) re-rendered on every
 * event. Widgets subscribe to the fields they read with `useLiveValue`.
 */
interface LiveStore {
  get: () => LiveContextValue;
  set: (patch: Partial<LiveContextValue>) => void;
  subscribe: (listener: () => void) => () => void;
}

function createLiveStore(): LiveStore {
  let state = INITIAL;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch) => {
      state = { ...state, ...patch };
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const LiveContext = createContext<LiveStore | null>(null);

/**
 * A nodexch gateway is paid per request (a monthly quota and a rate a minute), and its socket
 * pushes what the polls would ask for. With it the app asks again only when a transaction
 * block arrives, looks at the mempool less often, and polls as a rare check (TASK-115).
 */
const METERED_MEMPOOL_GAP_MS = 30_000;
const METERED_QUIET_POLL_MS = 5 * 60_000;
const STATE_FRAME_WAIT_MS = 400;

/** Coalesces bursts of invalidations (Coinset sends several mempool deltas per second when busy). */
function throttled(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let last = 0;
  const invoke = () => {
    const due = last + ms - Date.now();
    if (due <= 0) {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      last = Date.now();
      fn();
    } else if (timer === null) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        fn();
      }, due);
    }
  };
  invoke.cancel = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  return invoke;
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const { client, endpoints, hydrated } = useSettings();
  const queryClient = useQueryClient();
  const [store] = useState(createLiveStore);
  const network = endpoints.network;
  const peakRef = useRef<number | null>(null);
  const startedRef = useRef(false);
  const metered = endpoints.provider === "nodexch";

  useEffect(() => {
    // Until the stored settings are in, do nothing: the endpoint may not be the default one.
    if (!hydrated) return;
    // Queries that started from the hydration render were refused (see SettingsProvider);
    // refetch them now with the real endpoint. On the first run the ones in flight were started
    // by this same commit with the real endpoint: asking them again would double the load.
    const first = !startedRef.current;
    startedRef.current = true;
    void queryClient.invalidateQueries(
      first ? { predicate: (query) => query.state.fetchStatus !== "fetching" } : undefined
    );
    // Network or endpoint changed: forget everything learnt from the previous one so widgets
    // that key on the peak (recent blocks, confirmations) wait for the new chain's first poll.
    peakRef.current = null;
    store.set({
      ...INITIAL,
      txBatch: store.get().txBatch,
      transport: store.get().transport,
      status: "connecting",
    });
    // Only the families that change with a new peak: state, fees and the recent window.
    // Per-block data (records by hash, transactions, asset totals) is immutable and keyed by
    // height/hash, so it is never invalidated here.
    // The socket pushes the state (a nodexch gateway's live and peak frames): the cached
    // state follows them and is not asked for again on a new block.
    let statePushed = false;
    // The socket pushes each new block's record: the recent window takes them as they come.
    let blocksPushed = false;
    // The socket pushes the gateway's fee quote when it changes: the fee cards follow it.
    let feesPushed = false;
    const recentKey = [...queryKeys.chainRoot(network), "recent"] as const;
    const invalidateChain = throttled(() => {
      if (!statePushed) void queryClient.invalidateQueries({ queryKey: queryKeys.state(network) });
      if (!feesPushed) void queryClient.invalidateQueries({ queryKey: queryKeys.fee(network) });
      if (!blocksPushed) void queryClient.invalidateQueries({ queryKey: recentKey });
    }, 1_000);
    const invalidateMempool = throttled(
      () => void queryClient.invalidateQueries({ queryKey: queryKeys.mempoolRoot(network) }),
      metered ? METERED_MEMPOOL_GAP_MS : 3_000
    );
    const summaryKey = queryKeys.mempoolSummary(network, "browser");
    // The gateway's deltas keep the mempool current: transaction events and blocks then need
    // no read of it. Off again whenever the socket is not live.
    let deltaFed = false;
    const patchSummaryState = (patch: Partial<MempoolStateSummary>) =>
      queryClient.setQueryData<MempoolSummary>(
        summaryKey,
        (prev) => prev && { ...prev, state: { ...prev.state, ...patch } }
      );
    const stream = createLiveStream({
      wsUrl: endpoints.wsUrl,
      pollIntervalMs: endpoints.wsUrl ? 15_000 : 5_000,
      quietPollIntervalMs: metered ? METERED_QUIET_POLL_MS : undefined,
      poll: async (signal) => {
        // Through the state query, so a poll and a widget asking at once share one request
        // (on its own signal: stopping the stream must not fail the shared query).
        const state = await queryClient.fetchQuery({
          queryKey: queryKeys.state(network),
          queryFn: ({ signal: stateSignal }) => fetchBlockchainState(client, stateSignal),
          staleTime: 0,
        });
        signal.throwIfAborted();
        return {
          peakHeight: state.peak.height,
          peakIsTx: state.peak.isTransactionBlock,
          mempoolSize: state.mempoolSize,
        };
      },
      onEvent: (event) => {
        if (event.type === "status") {
          store.set({ status: event.status, transport: stream.transport });
          if (event.status !== "live" && blocksPushed) {
            blocksPushed = false;
            void queryClient.invalidateQueries({ queryKey: recentKey });
          }
          if (event.status !== "live" && statePushed) {
            // Frames were missed while the socket was away: ask for the state again.
            statePushed = false;
            void queryClient.invalidateQueries({ queryKey: queryKeys.state(network) });
          }
          if (event.status !== "live" && feesPushed) {
            feesPushed = false;
            void queryClient.invalidateQueries({ queryKey: queryKeys.fee(network) });
          }
          if (event.status !== "live" && deltaFed) {
            // Deltas were missed while the socket was away: read the mempool again.
            deltaFed = false;
            invalidateMempool();
          }
          return;
        }
        const lastEventAt = Date.now();
        if (event.type === "peak") {
          if (peakRef.current === event.height) {
            store.set({ lastEventAt });
            return;
          }
          const firstPeak = peakRef.current === null;
          peakRef.current = event.height;
          store.set({ lastEventAt, peakHeight: event.height });
          // The first peak only says where the chain is: every reader has just asked (and a
          // reorg, which also clears the peak, has invalidated them itself).
          if (firstPeak) return;
          if (statePushed) {
            queryClient.setQueryData<BlockchainState>(
              queryKeys.state(network),
              (prev) =>
                prev && {
                  ...prev,
                  peak: {
                    ...prev.peak,
                    height: event.height,
                    isTransactionBlock: event.tx,
                    prevTransactionBlockHeight: prev.peak.isTransactionBlock
                      ? prev.peak.height
                      : prev.peak.prevTransactionBlockHeight,
                    ...(event.headerHash ? { headerHash: event.headerHash } : {}),
                    ...(event.tx && event.timestamp ? { timestamp: event.timestamp } : {}),
                  },
                }
            );
          }
          if (deltaFed) {
            patchSummaryState({
              peakHeight: event.height,
              ...(event.tx ? { lastTxBlockHeight: event.height } : {}),
            });
          }
          // Only a transaction block changes fees, the mempool and the row of blocks.
          if (metered && !event.tx) return;
          // A nodexch gateway sends the block's state frame right after its peak frame: wait
          // for it, so that the state is not asked for when the socket is about to say it.
          if (metered) window.setTimeout(invalidateChain, STATE_FRAME_WAIT_MS);
          else invalidateChain();
          if (!deltaFed) invalidateMempool();
        } else if (event.type === "state") {
          statePushed = true;
          store.set({ lastEventAt });
          // The gateway's own figures stand in for the poll: keep the cached state current.
          queryClient.setQueryData<BlockchainState>(
            queryKeys.state(network),
            (prev) =>
              prev && {
                ...prev,
                mempoolSize: event.mempoolSize,
                mempoolCost: event.mempoolCost,
                mempoolFees: event.mempoolFees,
                synced: event.synced,
              }
          );
          patchSummaryState({
            mempoolSize: event.mempoolSize,
            mempoolCost: event.mempoolCost,
            mempoolFees: event.mempoolFees.toString(),
            synced: event.synced,
          });
        } else if (event.type === "block") {
          blocksPushed = true;
          store.set({ lastEventAt });
          if (event.totals)
            seedBlockTotals(queryClient, network, [
              { height: event.record.height, hash: event.record.headerHash, totals: event.totals },
            ]);
          for (const query of queryClient.getQueryCache().findAll({ queryKey: recentKey })) {
            const prev = query.state.data as RecentBlocksResult | undefined;
            const count = Number(query.queryKey[3]);
            if (!prev || !Number.isFinite(count)) continue;
            queryClient.setQueryData(query.queryKey, addRecentBlock(prev, event.record, count));
          }
        } else if (event.type === "fees") {
          feesPushed = true;
          store.set({ lastEventAt });
          const state = queryClient.getQueryData<BlockchainState>(queryKeys.state(network)) ?? null;
          // The dashboard's fee queries (key: cost); the fees page's own targets keep their call.
          for (const query of queryClient
            .getQueryCache()
            .findAll({ queryKey: queryKeys.fee(network) })) {
            const cost = query.queryKey[3];
            if (query.queryKey.length !== 4 || typeof cost !== "number") continue;
            queryClient.setQueryData(
              query.queryKey,
              feeEstimateFromQuote(event.quote, cost, state)
            );
          }
        } else if (event.type === "mempoolDelta") {
          store.set({ lastEventAt });
          const current = queryClient.getQueryData<MempoolSummary>(summaryKey);
          // Deltas can only keep a full view current (not the last visit's snapshot or a sync
          // in progress), and only when every entry came with its details.
          if (!event.added || current?.source !== "browser") {
            deltaFed = false;
            invalidateMempool();
            return;
          }
          deltaFed = true;
          queryClient.setQueryData(
            summaryKey,
            applyMempoolDelta(current, event.added, event.removed)
          );
          // A read in flight may have left the gateway before this delta: read once more.
          if (queryClient.getQueryState(summaryKey)?.fetchStatus === "fetching")
            invalidateMempool();
        } else if (event.type === "transaction") {
          store.set({ lastEventAt, txBatch: store.get().txBatch + 1, lastTxEvent: event });
          if (!deltaFed) invalidateMempool();
          event.ids.forEach(
            (id) => void queryClient.invalidateQueries({ queryKey: queryKeys.tx(network, id) })
          );
          if (event.status === "confirmed") {
            void queryClient.invalidateQueries({ queryKey: queryKeys.addressRoot(network) });
          }
        } else if (event.type === "mempool") {
          store.set({ lastEventAt });
          invalidateMempool();
        } else if (event.type === "netspace") {
          store.set({
            lastEventAt,
            netspace: { bytes: event.bytes, difficulty: event.difficulty, at: lastEventAt },
          });
        } else if (event.type === "vault") {
          store.set({ lastEventAt, lastVault: event });
        } else if (event.type === "reorg") {
          store.set({ lastEventAt, lastReorg: event });
          // The rolled-back blocks are gone: everything keyed on the recent chain is stale.
          peakRef.current = null;
          invalidateChain();
          invalidateMempool();
          // Height-based lists, transactions and balances can all describe the old fork.
          // Cancel old reads before invalidation so an in-flight response cannot win the race.
          const affected = {
            predicate: (query: { queryKey: readonly unknown[] }) =>
              query.queryKey[1] === network &&
              ["chain", "tx", "coin", "address", "cat", "nft"].includes(String(query.queryKey[0])),
          };
          void queryClient
            .cancelQueries(affected)
            .then(() => queryClient.invalidateQueries(affected));
        }
      },
    });
    stream.start();
    return () => {
      stream.stop();
      invalidateChain.cancel();
      invalidateMempool.cancel();
    };
  }, [client, endpoints.wsUrl, hydrated, metered, network, queryClient, store]);

  return <LiveContext.Provider value={store}>{children}</LiveContext.Provider>;
}

function useLiveStore(): LiveStore {
  const store = useContext(LiveContext);
  if (!store) throw new Error("useLive must be used inside LiveProvider");
  return store;
}

/**
 * True while a metered gateway's socket is live: its events already say when to ask again, so
 * the safety-net refetch intervals are left off.
 */
export function useMeteredLive(): boolean {
  const { endpoints } = useSettings();
  const status = useLiveValue("status");
  return endpoints.provider === "nodexch" && status === "live";
}

/** One field of the live state; the component re-renders only when that field changes. */
export function useLiveValue<K extends keyof LiveContextValue>(key: K): LiveContextValue[K] {
  const store = useLiveStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.get()[key],
    () => INITIAL[key]
  );
}

/** The whole live state: re-renders on every event, so only for pages that show all of it. */
export function useLive(): LiveContextValue {
  const store = useLiveStore();
  return useSyncExternalStore(store.subscribe, store.get, () => INITIAL);
}
