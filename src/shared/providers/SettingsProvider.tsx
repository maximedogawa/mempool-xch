"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { DEFAULT_SETTINGS, getSettingsStore, resolveEndpoints, type ResolvedEndpoints, type Settings } from "@/shared/lib/settings/store";
import { createRpcClient, type RpcClient } from "@/shared/lib/rpc/client";
import { NETWORKS, type NetworkConfig } from "@/shared/config/networks";

export interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Settings> | ((prev: Settings) => Settings)) => void;
  reset: () => void;
  endpoints: ResolvedEndpoints;
  networkConfig: NetworkConfig;
  client: RpcClient;
  /** True until the client-side store has replaced the SSR defaults. */
  hydrated: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const serverSnapshot = () => DEFAULT_SETTINGS;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const store = getSettingsStore();
  const settings = useSyncExternalStore(store.subscribe, store.get, serverSnapshot);
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const endpoints = useMemo(() => resolveEndpoints(settings), [settings]);
  const client = useMemo(
    () => createRpcClient({ rpcUrl: endpoints.rpcUrl, indexedUrl: endpoints.indexedUrl }),
    [endpoints.rpcUrl, endpoints.indexedUrl]
  );
  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      update: store.set,
      reset: store.reset,
      endpoints,
      networkConfig: NETWORKS[settings.network],
      client,
      hydrated,
    }),
    [settings, store, endpoints, client, hydrated]
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

export function useRpcClient(): RpcClient {
  return useSettings().client;
}
