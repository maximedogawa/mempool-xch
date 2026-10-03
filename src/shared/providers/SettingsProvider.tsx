"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import { createRpcClient, type FetchLike, type RpcClient } from "@/shared/lib/rpc/client";
import { createDexieFetch, type DexieRoute } from "@/shared/lib/hosted/dexie";
import { browserStorage } from "@/shared/lib/browserStorage";
import { loadProbe, probeIndexed, saveProbe } from "@/shared/lib/rpc/probe";
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
  /**
   * The nodexch gateway that answers Dexie's API paths and icons, on a network with a hosted
   * gateway while nodexch is the provider; null when Dexie is asked directly (Coinset, a custom
   * node, testnet11).
   */
  dexieRoute: DexieRoute | null;
  /** fetch for Dexie API URLs: through `dexieRoute` when there is one, else Dexie itself. */
  dexieFetch: FetchLike;
}

/** Dexie's paths on the gateway, only where a hosted gateway runs: elsewhere Dexie stays. */
function dexieRouteOf(endpoints: ResolvedEndpoints): DexieRoute | null {
  return endpoints.provider === "nodexch" && NETWORKS[endpoints.network].nodexchUrl
    ? { gateway: endpoints.rpcUrl, apiKey: endpoints.apiKey }
    : null;
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
  const resolved = useMemo(() => resolveEndpoints(settings), [settings]);
  // A nodexch gateway without an index: its indexed features switch off (probeIndexed).
  const [indexOffFor, setIndexOffFor] = useState<string | null>(null);
  const endpoints = useMemo(
    () =>
      resolved.provider === "nodexch" && indexOffFor === resolved.rpcUrl
        ? { ...resolved, indexedUrl: null }
        : resolved,
    [resolved, indexOffFor]
  );
  useEffect(() => {
    if (!hydrated || resolved.provider !== "nodexch") return;
    const known = loadProbe(browserStorage(), resolved.rpcUrl);
    if (known !== null) {
      setIndexOffFor(known ? null : resolved.rpcUrl);
      return;
    }
    const controller = new AbortController();
    const probe = createRpcClient({
      rpcUrl: resolved.rpcUrl,
      indexedUrl: resolved.rpcUrl,
      nodexch: { apiKey: resolved.apiKey },
      timeoutMs: 10_000,
    });
    void probeIndexed(probe, controller.signal).then((on) => {
      if (controller.signal.aborted) return;
      saveProbe(browserStorage(), resolved.rpcUrl, on);
      setIndexOffFor(on ? null : resolved.rpcUrl);
    });
    return () => controller.abort();
  }, [hydrated, resolved.provider, resolved.rpcUrl, resolved.apiKey]);
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
  const activeEndpoints = useRef(endpoints);
  activeEndpoints.current = endpoints;
  const hydratedRef = useRef(hydrated);
  hydratedRef.current = hydrated;
  const client = useMemo(
    () =>
      createRpcClient({
        rpcUrl: endpoints.rpcUrl,
        indexedUrl: endpoints.indexedUrl,
        nodexch: endpoints.provider === "nodexch" ? { apiKey: endpoints.apiKey } : undefined,
        fetchImpl: (input, init) =>
          hydratedRef.current &&
          activeEndpoints.current.rpcUrl === endpoints.rpcUrl &&
          activeEndpoints.current.indexedUrl === endpoints.indexedUrl
            ? fetch(input, init)
            : Promise.reject(new RpcError("aborted", "hydration", "Settings not hydrated yet")),
      }),
    [endpoints.rpcUrl, endpoints.indexedUrl, endpoints.provider, endpoints.apiKey]
  );
  // Read per request, so one fetch serves every provider; before hydration (SSR defaults) Dexie
  // is asked directly, as it always was, instead of a gateway the visitor may not use. The
  // gateway's answer stands (owner, 2026-10-02): a failing nodexch shows, Dexie is not asked
  // behind it.
  const dexieFetch = useMemo(
    () =>
      createDexieFetch({
        route: () => (hydratedRef.current ? dexieRouteOf(activeEndpoints.current) : null),
        fetch: (input, init) => fetch(input, init),
        fallback: false,
      }),
    []
  );
  const dexieRoute = useMemo(
    () => (hydrated ? dexieRouteOf(endpoints) : null),
    [hydrated, endpoints]
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
      dexieRoute,
      dexieFetch,
    }),
    [settings, store, endpoints, client, hydrated, dexieRoute, dexieFetch]
  );
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
