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
import { queryKeys } from "@/shared/api/queryKeys";
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

/** Coalesces bursts of invalidations (Coinset sends several mempool deltas per second when busy). */
function throttled(fn: () => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let last = 0;
  return () => {
    const due = last + ms - Date.now();
    if (due <= 0) {
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
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const { client, endpoints, hydrated } = useSettings();
  const queryClient = useQueryClient();
  const [store] = useState(createLiveStore);
  const network = endpoints.network;
  const peakRef = useRef<number | null>(null);

  useEffect(() => {
    // Until the stored settings are in, do nothing: the endpoint may not be the default one.
    if (!hydrated) return;
    // Queries that started from the hydration render were refused (see SettingsProvider);
    // refetch them now with the real endpoint.
    void queryClient.invalidateQueries();
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
    const invalidateChain = throttled(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.state(network) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.fee(network) });
      void queryClient.invalidateQueries({ queryKey: [...queryKeys.chainRoot(network), "recent"] });
    }, 1_000);
    const invalidateMempool = throttled(
      () => void queryClient.invalidateQueries({ queryKey: queryKeys.mempoolRoot(network) }),
      3_000
    );
    const stream = createLiveStream({
      wsUrl: endpoints.wsUrl,
      pollIntervalMs: endpoints.wsUrl ? 15_000 : 5_000,
      poll: async () => {
        const state = await client.getBlockchainState();
        queryClient.setQueryData(queryKeys.state(network), state);
        return {
          peakHeight: state.peak.height,
          peakIsTx: state.peak.isTransactionBlock,
          mempoolSize: state.mempoolSize,
        };
      },
      onEvent: (event) => {
        if (event.type === "status") {
          store.set({ status: event.status, transport: stream.transport });
          return;
        }
        const lastEventAt = Date.now();
        if (event.type === "peak") {
          if (peakRef.current === event.height) {
            store.set({ lastEventAt });
            return;
          }
          peakRef.current = event.height;
          store.set({ lastEventAt, peakHeight: event.height });
          invalidateChain();
          invalidateMempool();
        } else if (event.type === "transaction") {
          store.set({ lastEventAt, txBatch: store.get().txBatch + 1, lastTxEvent: event });
          invalidateMempool();
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
          void queryClient.invalidateQueries({ queryKey: queryKeys.blockRoot(network) });
        }
      },
    });
    stream.start();
    return () => stream.stop();
  }, [client, endpoints.wsUrl, hydrated, network, queryClient, store]);

  return <LiveContext.Provider value={store}>{children}</LiveContext.Provider>;
}

function useLiveStore(): LiveStore {
  const store = useContext(LiveContext);
  if (!store) throw new Error("useLive must be used inside LiveProvider");
  return store;
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
