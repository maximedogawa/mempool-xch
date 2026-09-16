"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createLiveStream, type LiveEvent, type LiveStatus, type LiveTransport } from "@/shared/lib/live/stream";
import { fetchChainSnapshot, isChainFallbackError } from "@/shared/api/chain";
import { queryKeys } from "@/shared/api/queryKeys";
import { useSettings } from "./SettingsProvider";

export interface LiveContextValue {
  status: LiveStatus;
  /** Transport the stream ended up on: hosted server events, the direct Coinset socket or polling. */
  transport: LiveTransport;
  /** Unix ms of the last event (peak, transaction or poll sample). */
  lastEventAt: number | null;
  peakHeight: number | null;
  /** Monotonic counter bumped on every transaction batch, for feeds that want a nudge. */
  txBatch: number;
  lastTxEvent: Extract<LiveEvent, { type: "transaction" }> | null;
}

const LiveContext = createContext<LiveContextValue | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const { client, endpoints, hydrated } = useSettings();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<LiveStatus>("offline");
  const [transport, setTransport] = useState<LiveTransport>("polling");
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [peakHeight, setPeakHeight] = useState<number | null>(null);
  const [txBatch, setTxBatch] = useState(0);
  const [lastTxEvent, setLastTxEvent] = useState<LiveContextValue["lastTxEvent"]>(null);
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
    setStatus("connecting");
    const stream = createLiveStream({
      sseUrl: endpoints.eventsUrl,
      wsUrl: endpoints.wsUrl,
      pollIntervalMs: endpoints.eventsUrl || endpoints.wsUrl ? 15_000 : 5_000,
      poll: async () => {
        // Hosted: the safety poll reads our own chain cache, not Coinset.
        let state = null;
        if (endpoints.chainUrl) {
          try {
            state = (await fetchChainSnapshot(endpoints.chainUrl)).state;
          } catch (error) {
            if (!isChainFallbackError(error)) throw error;
          }
        }
        if (!state) state = await client.getBlockchainState();
        queryClient.setQueryData(queryKeys.state(network), state);
        return { peakHeight: state.peak.height, peakIsTx: state.peak.isTransactionBlock, mempoolSize: state.mempoolSize };
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
          void queryClient.invalidateQueries({ queryKey: queryKeys.chainRoot(network) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.mempoolRoot(network) });
        } else if (event.type === "transaction") {
          setTxBatch((n) => n + 1);
          setLastTxEvent(event);
          void queryClient.invalidateQueries({ queryKey: queryKeys.mempoolRoot(network) });
          event.ids.forEach((id) => void queryClient.invalidateQueries({ queryKey: queryKeys.tx(network, id) }));
          if (event.status === "confirmed") {
            void queryClient.invalidateQueries({ queryKey: queryKeys.addressRoot(network) });
          }
        } else if (event.type === "mempool" || event.type === "mempool_delta") {
          void queryClient.invalidateQueries({ queryKey: queryKeys.mempoolRoot(network) });
        } else if (event.type === "block") {
          void queryClient.invalidateQueries({ queryKey: queryKeys.chainRoot(network) });
        } else if (event.type === "resync") {
          void queryClient.invalidateQueries({ queryKey: queryKeys.chainRoot(network) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.mempoolRoot(network) });
        }
      },
    });
    stream.start();
    return () => stream.stop();
  }, [client, endpoints.chainUrl, endpoints.eventsUrl, endpoints.wsUrl, hydrated, network, queryClient]);

  const value = useMemo<LiveContextValue>(
    () => ({ status, transport, lastEventAt, peakHeight, txBatch, lastTxEvent }),
    [status, transport, lastEventAt, peakHeight, txBatch, lastTxEvent]
  );
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used inside LiveProvider");
  return ctx;
}
