"use client";

import { useCallback, useRef, useState } from "react";
import { createLimiter } from "@/shared/lib/limit";
import type { RpcClient } from "@/shared/lib/rpc/client";
import { summariseRecentActivity, type TokenActivitySample } from "@/shared/lib/tokens/activity";
import { RECENT_SAMPLE } from "./useTokenActivity";

/** Sort modes that need every token's activity figures, not just the visible page's. */
export const SCAN_LIMIT = 250;
const SCAN_CONCURRENCY = 6;

export interface TokenScanState {
  results: Map<string, TokenActivitySample>;
  scanning: boolean;
  done: number;
  total: number;
}

/**
 * Bounded background scan over a capped list of asset ids (the "most active" / "volume" /
 * "recently active" / "newest" sorts): each token gets the same two cheap calls as
 * useTokenActivity's single-row fetch, run with a small concurrency limit so a client-side sort
 * across hundreds of known CATs never turns into an unbounded fan-out.
 */
export function useTokenScan(client: RpcClient) {
  const [state, setState] = useState<TokenScanState>({ results: new Map(), scanning: false, done: 0, total: 0 });
  const runId = useRef(0);

  const scan = useCallback(
    (assetIds: string[]) => {
      const ids = assetIds.slice(0, SCAN_LIMIT);
      const id = (runId.current += 1);
      setState({ results: new Map(), scanning: true, done: 0, total: ids.length });
      if (!client.hasIndexed || ids.length === 0) {
        setState((s) => ({ ...s, scanning: false }));
        return;
      }
      const limiter = createLimiter(SCAN_CONCURRENCY);
      let done = 0;
      void Promise.all(
        ids.map((assetId) =>
          limiter(async () => {
            try {
              const [firstPage, recentPage] = await Promise.all([
                client.getTransactionsByCatAssetId(assetId, { limit: 1, order: "asc" }),
                client.getTransactionsByCatAssetId(assetId, { limit: RECENT_SAMPLE, order: "desc" }),
              ]);
              const sample: TokenActivitySample = {
                firstSeenMs: firstPage.transactions[0]?.confirmedAtMs ?? null,
                ...summariseRecentActivity(assetId, recentPage.transactions, recentPage.nextCursor !== null),
              };
              done += 1;
              if (runId.current === id) setState((s) => ({ ...s, results: new Map(s.results).set(assetId, sample), done }));
            } catch {
              done += 1;
              if (runId.current === id) setState((s) => ({ ...s, done }));
            }
          })
        )
      ).then(() => {
        if (runId.current === id) setState((s) => ({ ...s, scanning: false }));
      });
    },
    [client]
  );

  const reset = useCallback(() => {
    runId.current += 1;
    setState({ results: new Map(), scanning: false, done: 0, total: 0 });
  }, []);

  return { ...state, scan, reset };
}
