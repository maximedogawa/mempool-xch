"use client";

import { useEffect, useRef, useState } from "react";
import { useMempoolSummary } from "@/shared/api/hooks";
import {
  appendSample,
  loadHistory,
  sampleFromSummary,
  saveHistory,
  type MempoolSample,
} from "@/shared/lib/mempool/history";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** Collects one sample per summary refresh into a rolling, persisted window. */
export function useMempoolHistory(): { history: MempoolSample[]; startedAt: number | null } {
  const { endpoints } = useSettings();
  const summary = useMempoolSummary();
  const [history, setHistory] = useState<MempoolSample[]>([]);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (loadedFor.current === endpoints.network) return;
    loadedFor.current = endpoints.network;
    setHistory(loadHistory(window.localStorage, endpoints.network));
  }, [endpoints.network]);

  const generatedAt = summary.data?.generatedAt;
  useEffect(() => {
    if (!summary.data || loadedFor.current !== endpoints.network) return;
    // A snapshot from the last visit or a first sync in progress is not the mempool right now.
    if (summary.data.source === "snapshot" || summary.data.source === "syncing") return;
    const sample = sampleFromSummary(summary.data, Date.now());
    setHistory((prev) => {
      const next = appendSample(prev, sample);
      if (next !== prev) saveHistory(window.localStorage, endpoints.network, next);
      return next;
    });
    // Sample on every new summary generation, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedAt, endpoints.network]);

  return { history, startedAt: history[0]?.t ?? null };
}
