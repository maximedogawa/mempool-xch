"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/queryKeys";
import { fetchHandleArt, fetchAddressHandle } from "@/shared/lib/handles/mintgardenHandles";
import {
  fetchHandle,
  fetchHandleRegistration,
  type HandleRecord,
  type HandleRegistration,
} from "@/shared/lib/handles/xchandles";
import type { HandleArt } from "@/shared/lib/handles/mintgardenHandles";
import { useSettings } from "@/shared/providers/SettingsProvider";

/** The resolution can change with any registry spend, so it is refreshed rather than cached. */
const REFRESH_MS = 60_000;

/** Both registries are mainnet services; on testnet there is nothing to resolve against. */
export interface HandleData {
  record: HandleRecord | undefined;
  art: HandleArt | null | undefined;
  registration: HandleRegistration | null | undefined;
  isLoading: boolean;
  available: boolean;
  refetch: () => void;
}

export function useHandle(handle: string | null): HandleData {
  const { networkConfig, hydrated } = useSettings();
  const network = networkConfig.id;
  const available = network === "mainnet" && !!handle;
  const enabled = available && hydrated;
  const name = handle ?? "";
  const record = useQuery({
    queryKey: queryKeys.handle(network, name, "record"),
    queryFn: () => fetchHandle(name),
    enabled,
    refetchInterval: REFRESH_MS,
    staleTime: 30_000,
  });
  const art = useQuery({
    queryKey: queryKeys.handle(network, name, "art"),
    queryFn: () => fetchHandleArt(name),
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  const registration = useQuery({
    queryKey: queryKeys.handle(network, name, "registration"),
    queryFn: () => fetchHandleRegistration(name),
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
  return {
    record: record.data,
    art: art.data,
    registration: registration.data,
    isLoading: record.isLoading,
    available,
    refetch: () => void record.refetch(),
  };
}

/** The handle that resolves to an address, for the address page. */
export function useAddressHandle(puzzleHash: string | null) {
  const { networkConfig, hydrated } = useSettings();
  const enabled = networkConfig.id === "mainnet" && !!puzzleHash && hydrated;
  return useQuery({
    queryKey: queryKeys.handle(networkConfig.id, puzzleHash ?? "", "byAddress"),
    queryFn: () => fetchAddressHandle(puzzleHash ?? ""),
    enabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
