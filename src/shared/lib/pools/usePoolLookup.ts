"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { queryKeys } from "@/shared/api/queryKeys";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { useSettings } from "@/shared/providers/SettingsProvider";
import { claimsFromTransaction } from "./claims";
import { getPoolClaimStore, type ClaimMap, type StoredClaim } from "./claimStore";
import { lookupPool, type PoolEntry } from "./registry";

const EMPTY: ClaimMap = new Map();

/** The locally cached pool claims for the active network (claimStore.ts). */
export function usePoolClaims(): ClaimMap {
  const { endpoints } = useSettings();
  const store = getPoolClaimStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.get(endpoints.network),
    () => EMPTY
  );
}

/**
 * Names a block's pool from its payout puzzle hash: a registry-known fixed address directly, or a
 * PlotNFT address through the claim target this browser has already resolved for it (the pools
 * page fills that cache). Null when neither is known.
 */
export function usePoolLookup(): (payoutHash: string) => PoolEntry | null {
  const claims = usePoolClaims();
  return useCallback(
    (payoutHash: string) => {
      const target = claims.get(payoutHash)?.target;
      return lookupPool(payoutHash) ?? (target ? lookupPool(target) : null);
    },
    [claims]
  );
}

export interface BlockPool {
  entry: PoolEntry | null;
  /** The payout address's resolved claim, when it has one. */
  claim: StoredClaim | null;
  /** Pool and farmer reward go to the same address: not an official-protocol PlotNFT. */
  bothShares: boolean;
}

/**
 * Who farmed one block (block and transaction pages). Unlike usePoolLookup this looks the payout
 * address's claim up when the browser has not seen it yet: one indexed call, then cached.
 */
export function useBlockPool(
  record: Pick<BlockRecord, "poolPuzzleHash" | "farmerPuzzleHash"> | undefined
): BlockPool {
  const { client, endpoints } = useSettings();
  const claims = usePoolClaims();
  const payout = record?.poolPuzzleHash ?? null;
  const bothShares = record !== undefined && record.poolPuzzleHash === record.farmerPuzzleHash;
  const claim = payout ? (claims.get(payout) ?? null) : null;
  const fixed = payout ? lookupPool(payout) : null;

  useQuery({
    queryKey: [...queryKeys.blockRoot(endpoints.network), "poolClaim", payout],
    enabled: client.hasIndexed && payout !== null && !bothShares && !fixed && !claim,
    staleTime: Infinity,
    queryFn: async ({ signal }) => {
      const tx = (await client.getTransactionsByP2(payout!, { limit: 1 }, signal)).transactions[0];
      const resolved = tx ? claimsFromTransaction(tx) : new Map();
      if (!resolved.has(payout!)) resolved.set(payout!, { target: null, selfPooled: false });
      getPoolClaimStore().setMany(endpoints.network, resolved);
      return true;
    },
  });

  return { entry: fixed ?? (claim?.target ? lookupPool(claim.target) : null), claim, bothShares };
}
