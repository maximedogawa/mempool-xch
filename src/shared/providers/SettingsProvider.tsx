"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  DEFAULT_SETTINGS,
  getSettingsStore,
  resolveEndpoints,
  type ResolvedEndpoints,
  type Settings,
} from "@/shared/lib/settings/store";
import { createRpcClient, type RpcClient } from "@/shared/lib/rpc/client";
import { RpcError } from "@/shared/lib/rpc/errors";
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
  // Scroll to the top and drop transient per-network UI state when the network changes.
  const previousNetwork = useRef(settings.network);
  useEffect(() => {
    if (previousNetwork.current === settings.network) return;
    previousNetwork.current = settings.network;
    window.scrollTo({ top: 0 });
  }, [settings.network]);
  // The hydration render still sees the SSR defaults (Coinset). Any fetch started from that
  // render must not go out: a user with a custom node would otherwise leak a burst of calls
  // to Coinset and the hosted APIs on every page load. LiveProvider refetches once hydrated.
  const hydratedRef = useRef(hydrated);
  hydratedRef.current = hydrated;
  const client = useMemo(
    () =>
      createRpcClient({
        rpcUrl: endpoints.rpcUrl,
        indexedUrl: endpoints.indexedUrl,
        fetchImpl: (input, init) =>
          hydratedRef.current
            ? fetch(input, init)
            : Promise.reject(new RpcError("aborted", "hydration", "Settings not hydrated yet")),
      }),
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
