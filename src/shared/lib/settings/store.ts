/**
 * User settings (TASK-021): active network, RPC endpoint per network, theme. Persisted in
 * localStorage; a tiny external store so React reads it with useSyncExternalStore and the
 * non-React data layer can read it too.
 */
import { isCoinsetUrl, NETWORKS, NETWORK_IDS, type NetworkId } from "@/shared/config/networks";

export type ThemePreference = "dark" | "light" | "system";

export interface Settings {
  network: NetworkId;
  endpoints: Record<NetworkId, { rpcUrl: string }>;
  theme: ThemePreference;
  /** Number of recent blocks on the dashboard strip. */
  recentBlocks: number;
}

export const STORAGE_KEY = "mempool-xch:settings:v1";

export const DEFAULT_SETTINGS: Settings = {
  network: "mainnet",
  endpoints: {
    mainnet: { rpcUrl: NETWORKS.mainnet.rpcUrl },
    testnet11: { rpcUrl: NETWORKS.testnet11.rpcUrl },
  },
  theme: "dark",
  recentBlocks: 8,
};

export interface ResolvedEndpoints {
  network: NetworkId;
  rpcUrl: string;
  /** Null when the endpoint is not Coinset (indexed API unavailable). */
  indexedUrl: string | null;
  /** Null when the endpoint is not Coinset (WebSocket unavailable → polling). */
  wsUrl: string | null;
  /** Summary API on the hosted origin; null when the endpoint is custom (browser fallback). */
  summaryUrl: string | null;
  /** Chain cache (state, recent blocks, fee) on the hosted origin; null for custom endpoints. */
  chainUrl: string | null;
  /**
   * Server-sent events on the hosted origin. Null for custom endpoints and in the static Sage
   * snapshot, which keeps the direct Coinset WebSocket as its live channel (decision-006).
   */
  eventsUrl: string | null;
  isCoinset: boolean;
}

const SAGE_SNAPSHOT = process.env.NEXT_PUBLIC_SAGE_BUILD === "1";

/** Origin of the hosted app for the Sage snapshot; same-origin ("") for the hosted build. */
export function apiOrigin(): string {
  return (process.env.NEXT_PUBLIC_API_ORIGIN ?? "").replace(/\/$/, "");
}

export function resolveEndpoints(settings: Settings, network: NetworkId = settings.network): ResolvedEndpoints {
  const rpcUrl = settings.endpoints[network]?.rpcUrl?.trim() || NETWORKS[network].rpcUrl;
  const isCoinset = isCoinsetUrl(network, rpcUrl);
  return {
    network,
    rpcUrl: rpcUrl.replace(/\/$/, ""),
    indexedUrl: isCoinset ? NETWORKS[network].indexedUrl : null,
    wsUrl: isCoinset ? NETWORKS[network].wsUrl : null,
    summaryUrl: isCoinset ? `${apiOrigin()}/api/${network}/mempool` : null,
    chainUrl: isCoinset ? `${apiOrigin()}/api/${network}/chain` : null,
    eventsUrl: isCoinset && !SAGE_SNAPSHOT ? `${apiOrigin()}/api/${network}/events` : null,
    isCoinset,
  };
}

function sanitise(raw: unknown): Settings {
  const r = raw && typeof raw === "object" ? (raw as Partial<Settings>) : {};
  const network = NETWORK_IDS.includes(r.network as NetworkId) ? (r.network as NetworkId) : DEFAULT_SETTINGS.network;
  const endpoints = Object.fromEntries(
    NETWORK_IDS.map((id) => {
      const url = r.endpoints?.[id]?.rpcUrl;
      return [id, { rpcUrl: typeof url === "string" && url.trim() ? url.trim() : NETWORKS[id].rpcUrl }];
    })
  ) as Settings["endpoints"];
  const theme: ThemePreference = r.theme === "light" || r.theme === "system" ? r.theme : "dark";
  const recentBlocks = typeof r.recentBlocks === "number" && r.recentBlocks >= 3 && r.recentBlocks <= 20 ? r.recentBlocks : 8;
  return { network, endpoints, theme, recentBlocks };
}

type Listener = () => void;

export interface SettingsStore {
  get: () => Settings;
  set: (update: Partial<Settings> | ((prev: Settings) => Settings)) => void;
  reset: () => void;
  subscribe: (listener: Listener) => () => void;
}

export function createSettingsStore(storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null): SettingsStore {
  let current: Settings = DEFAULT_SETTINGS;
  const listeners = new Set<Listener>();
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (raw) current = sanitise(JSON.parse(raw));
  } catch {
    current = DEFAULT_SETTINGS;
  }
  const persist = () => {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // Storage may be unavailable (private mode, Sage webview restrictions): keep in memory.
    }
  };
  const emit = () => listeners.forEach((l) => l());
  return {
    get: () => current,
    set: (update) => {
      const next = typeof update === "function" ? update(current) : { ...current, ...update };
      current = sanitise(next);
      persist();
      emit();
    },
    reset: () => {
      current = DEFAULT_SETTINGS;
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

let browserStore: SettingsStore | null = null;

/** Singleton store bound to window.localStorage (in-memory during SSR). */
export function getSettingsStore(): SettingsStore {
  if (!browserStore) {
    const storage = typeof window !== "undefined" ? window.localStorage : null;
    browserStore = createSettingsStore(storage);
  }
  return browserStore;
}
