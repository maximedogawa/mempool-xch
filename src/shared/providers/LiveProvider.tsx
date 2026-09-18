"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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

const LiveContext = createContext<LiveContextValue | null>(null);

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
  const [status, setStatus] = useState<LiveStatus>("offline");
  const [transport, setTransport] = useState<LiveTransport>("polling");
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [peakHeight, setPeakHeight] = useState<number | null>(null);
  const [txBatch, setTxBatch] = useState(0);
  const [lastTxEvent, setLastTxEvent] = useState<LiveContextValue["lastTxEvent"]>(null);
  const [netspace, setNetspace] = useState<LiveContextValue["netspace"]>(null);
  const [lastReorg, setLastReorg] = useState<LiveContextValue["lastReorg"]>(null);
  const [lastVault, setLastVault] = useState<LiveContextValue["lastVault"]>(null);
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
    setPeakHeight(null);
    setLastEventAt(null);
    setLastTxEvent(null);
    setNetspace(null);
    setLastReorg(null);
    setLastVault(null);
    setStatus("connecting");
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
          setStatus(event.status);
          setTransport(stream.transport);
          return;
        }
        setLastEventAt(Date.now());
        if (event.type === "peak") {
          if (peakRef.current === event.height) return;
          peakRef.current = event.height;
          setPeakHeight(event.height);
          invalidateChain();
          invalidateMempool();
        } else if (event.type === "transaction") {
          setTxBatch((n) => n + 1);
          setLastTxEvent(event);
          invalidateMempool();
          event.ids.forEach(
            (id) => void queryClient.invalidateQueries({ queryKey: queryKeys.tx(network, id) })
          );
          if (event.status === "confirmed") {
            void queryClient.invalidateQueries({ queryKey: queryKeys.addressRoot(network) });
          }
        } else if (event.type === "mempool") {
          invalidateMempool();
        } else if (event.type === "netspace") {
          setNetspace({ bytes: event.bytes, difficulty: event.difficulty, at: Date.now() });
        } else if (event.type === "vault") {
          setLastVault(event);
        } else if (event.type === "reorg") {
          setLastReorg(event);
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
  }, [client, endpoints.wsUrl, hydrated, network, queryClient]);

  const value = useMemo<LiveContextValue>(
    () => ({
      status,
      transport,
      lastEventAt,
      peakHeight,
      txBatch,
      lastTxEvent,
      netspace,
      lastReorg,
      lastVault,
    }),
    [
      status,
      transport,
      lastEventAt,
      peakHeight,
      txBatch,
      lastTxEvent,
      netspace,
      lastReorg,
      lastVault,
    ]
  );
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used inside LiveProvider");
  return ctx;
}
