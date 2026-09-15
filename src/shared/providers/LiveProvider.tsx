"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createLiveStream, type LiveEvent, type LiveStatus } from "@/shared/lib/live/stream";
import { queryKeys } from "@/shared/api/queryKeys";
import { useSettings } from "./SettingsProvider";

export interface LiveContextValue {
  status: LiveStatus;
  /** Unix ms of the last event (peak, transaction or poll sample). */
  lastEventAt: number | null;
  peakHeight: number | null;
  /** Monotonic counter bumped on every transaction batch, for feeds that want a nudge. */
  txBatch: number;
  lastTxEvent: Extract<LiveEvent, { type: "transaction" }> | null;
}

const LiveContext = createContext<LiveContextValue | null>(null);

export function LiveProvider({ children }: { children: ReactNode }) {
  const { client, endpoints } = useSettings();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<LiveStatus>("offline");
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const [peakHeight, setPeakHeight] = useState<number | null>(null);
  const [txBatch, setTxBatch] = useState(0);
  const [lastTxEvent, setLastTxEvent] = useState<LiveContextValue["lastTxEvent"]>(null);
  const network = endpoints.network;
  const peakRef = useRef<number | null>(null);

  useEffect(() => {
    peakRef.current = null;
    const stream = createLiveStream({
      wsUrl: endpoints.wsUrl,
      pollIntervalMs: endpoints.wsUrl ? 15_000 : 5_000,
      poll: async () => {
        const state = await client.getBlockchainState();
        queryClient.setQueryData(queryKeys.state(network), state);
        return { peakHeight: state.peak.height, peakIsTx: state.peak.isTransactionBlock, mempoolSize: state.mempoolSize };
      },
      onEvent: (event) => {
        if (event.type === "status") {
          setStatus(event.status);
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
        } else if (event.type === "mempool") {
          void queryClient.invalidateQueries({ queryKey: queryKeys.mempoolRoot(network) });
        }
      },
    });
    stream.start();
    return () => stream.stop();
  }, [client, endpoints.wsUrl, network, queryClient]);

  const value = useMemo<LiveContextValue>(
    () => ({ status, lastEventAt, peakHeight, txBatch, lastTxEvent }),
    [status, lastEventAt, peakHeight, txBatch, lastTxEvent]
  );
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used inside LiveProvider");
  return ctx;
}
