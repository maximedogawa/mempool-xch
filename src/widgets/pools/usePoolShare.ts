"use client";

import { useQuery } from "@tanstack/react-query";
import { useBlockchainState } from "@/shared/api/hooks";
import { queryKeys } from "@/shared/api/queryKeys";
import { createLimiter } from "@/shared/lib/limit";
import { groupPoolShare, type PoolShare } from "@/shared/lib/pools/share";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { useLive } from "@/shared/providers/LiveProvider";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** Parity with xchmempool.com/pools: roughly one day of blocks. */
export const POOL_SHARE_WINDOW = 4608;
/** Coinset's get_block_records caps a single call at 1000 records. */
const CHUNK = 1000;
/** Re-bucket the peak so the window (and its query key) only moves every ~50 blocks. */
const BUCKET = 50;

const limiter = createLimiter(3);

export interface PoolShareResult {
  share: PoolShare;
  windowStart: number;
  windowEnd: number;
}

export function usePoolShare() {
  const { client, endpoints } = useSettings();
  const state = useBlockchainState();
  const { peakHeight } = useLive();
  const peak = peakHeight ?? state.data?.peak.height ?? null;
  const bucketedPeak = peak !== null ? peak - (peak % BUCKET) : null;

  return useQuery({
    queryKey: [...queryKeys.blockRoot(endpoints.network), "poolShare", bucketedPeak],
    enabled: bucketedPeak !== null,
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }): Promise<PoolShareResult> => {
      const end = bucketedPeak! + 1;
      const start = Math.max(0, end - POOL_SHARE_WINDOW);
      const chunks: { start: number; end: number }[] = [];
      for (let s = start; s < end; s += CHUNK) chunks.push({ start: s, end: Math.min(end, s + CHUNK) });
      const pages = await Promise.all(chunks.map((c) => limiter(() => client.getBlockRecords(c.start, c.end, signal))));
      const records: BlockRecord[] = pages.flat();
      return { share: groupPoolShare(records), windowStart: start, windowEnd: end - 1 };
    },
  });
}
