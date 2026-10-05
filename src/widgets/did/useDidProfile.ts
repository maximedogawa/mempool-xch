"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import {
  fetchDidHeldCollections,
  fetchDidProfile,
  type DidProfile,
  type HeldCollection,
} from "@/shared/lib/nft/mintgarden";
import { useSettings } from "@/shared/providers/SettingsProvider";

export interface DidHoldings {
  profile: DidProfile | null | undefined;
  collections: HeldCollection[] | undefined;
  isLoading: boolean;
  /** MintGarden indexes mainnet only; on testnet there is nothing to ask. */
  available: boolean;
}

/**
 * What a DID holds, as MintGarden sees it: the profile (name, avatar, owned count) and the
 * collections its NFTs come from. Both are best effort — a DID that never touched MintGarden
 * still answers, with empty fields — so neither query retries or throws.
 */
export function useDidHoldings(launcherId: string | null): DidHoldings {
  const { networkConfig, hydrated } = useSettings();
  const network = networkConfig.id;
  const available = network === "mainnet" && !!launcherId;
  const enabled = available && hydrated;
  const id = launcherId ?? "";
  const profile = useQuery({
    queryKey: queryKeys.did(network, id, "profile"),
    queryFn: () => fetchDidProfile(id, { counts: true }),
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const collections = useQuery({
    queryKey: queryKeys.did(network, id, "heldCollections"),
    queryFn: () => fetchDidHeldCollections(id),
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  return {
    profile: profile.data,
    collections: collections.data,
    isLoading: profile.isLoading || collections.isLoading,
    available,
  };
}
