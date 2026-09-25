/**
 * User settings: active network, RPC endpoint per network, theme, language. Persisted in
 * localStorage; a tiny external store so React reads it with useSyncExternalStore and the
 * non-React data layer can read it too.
 */
import {
  NETWORKS,
  NETWORK_IDS,
  providerOf,
  type NetworkId,
  type Provider,
} from "@/shared/config/networks";
import { browserStorage } from "@/shared/lib/browserStorage";
import { isLocale, type LocalePreference } from "@/shared/i18n/config";

export type ThemePreference = "dark" | "light" | "system";

/** One network's endpoint: its URL, whether it is a nodexch gateway, and its publishable key. */
export interface Endpoint {
  rpcUrl: string;
  /** Set for a nodexch gateway on a host the app does not know (self-hosted). */
  provider?: "nodexch";
  /** A nodexch publishable key (`nxp_…`), bound to this site's origin. Never a secret key. */
  apiKey?: string;
}

/** A nodexch publishable key: safe in a browser because the gateway binds it to origins. */
export const PUBLISHABLE_KEY = /^nxp_[A-Za-z0-9_-]{16,128}$/;

export interface Settings {
  network: NetworkId;
  endpoints: Record<NetworkId, Endpoint>;
  theme: ThemePreference;
  /** Number of recent blocks on the dashboard strip. */
  recentBlocks: number;
  /** Soft chime when one of the connected wallet's transactions lands in a block. */
  sounds: boolean;
  /** Opt-in browser notifications for the watchlist. Off until the visitor turns it on. */
  notifications: boolean;
  /** UI language; "auto" follows the browser's languages. */
  locale: LocalePreference;
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
  sounds: true,
  notifications: false,
  locale: "auto",
};

export interface ResolvedEndpoints {
  network: NetworkId;
  rpcUrl: string;
  /** Null when the endpoint has no indexed API (a custom node). */
  indexedUrl: string | null;
  /** Null without a WebSocket (a custom node: polling). A nodexch key rides in its query. */
  wsUrl: string | null;
  provider: Provider;
  /** Coinset itself: its read budget, its summary API and its wording. */
  isCoinset: boolean;
  /** The publishable key sent to a nodexch gateway; null otherwise. */
  apiKey: string | null;
}

/** A nodexch gateway's WebSocket: its own host, `/ws`, the key in the query (publishable keys only). */
export function nodexchWsUrl(rpcUrl: string, apiKey: string | null): string {
  const url = new URL(`${rpcUrl.replace(/\/$/, "")}/ws`);
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  if (apiKey) url.searchParams.set("key", apiKey);
  return url.toString();
}

export function resolveEndpoints(
  settings: Settings,
  network: NetworkId = settings.network
): ResolvedEndpoints {
  const endpoint = settings.endpoints[network];
  const rpcUrl = (endpoint?.rpcUrl?.trim() || NETWORKS[network].rpcUrl).replace(/\/$/, "");
  const provider = providerOf(network, rpcUrl, endpoint?.provider);
  if (provider === "nodexch") {
    // The site's own key for the hosted gateway, the user's for theirs.
    const apiKey = endpoint?.apiKey || NETWORKS[network].nodexchKey || null;
    return {
      network,
      rpcUrl,
      indexedUrl: rpcUrl,
      wsUrl: nodexchWsUrl(rpcUrl, apiKey),
      provider,
      isCoinset: false,
      apiKey,
    };
  }
  const isCoinset = provider === "coinset";
  return {
    network,
    rpcUrl,
    indexedUrl: isCoinset ? NETWORKS[network].indexedUrl : null,
    wsUrl: isCoinset ? NETWORKS[network].wsUrl : null,
    provider,
    isCoinset,
    apiKey: null,
  };
}

function sanitise(raw: unknown): Settings {
  const r = raw && typeof raw === "object" ? (raw as Partial<Settings>) : {};
  const network = NETWORK_IDS.includes(r.network as NetworkId)
    ? (r.network as NetworkId)
    : DEFAULT_SETTINGS.network;
  const endpoints = Object.fromEntries(
    NETWORK_IDS.map((id) => {
      const raw = r.endpoints?.[id];
      const url = raw?.rpcUrl;
      const endpoint: Endpoint = {
        rpcUrl: typeof url === "string" && url.trim() ? url.trim() : NETWORKS[id].rpcUrl,
      };
      if (raw?.provider === "nodexch") endpoint.provider = "nodexch";
      // Only a publishable key is kept: a secret key must never sit in a browser.
      if (typeof raw?.apiKey === "string" && PUBLISHABLE_KEY.test(raw.apiKey.trim())) {
        endpoint.apiKey = raw.apiKey.trim();
      }
      return [id, endpoint];
    })
  ) as Settings["endpoints"];
  const theme: ThemePreference = r.theme === "light" || r.theme === "system" ? r.theme : "dark";
  const recentBlocks =
    typeof r.recentBlocks === "number" && r.recentBlocks >= 3 && r.recentBlocks <= 20
      ? r.recentBlocks
      : 8;
  const sounds = r.sounds !== false;
  const notifications = r.notifications === true;
  const locale: LocalePreference = isLocale(r.locale) ? r.locale : "auto";
  return { network, endpoints, theme, recentBlocks, sounds, notifications, locale };
}

type Listener = () => void;

export interface SettingsStore {
  get: () => Settings;
  set: (update: Partial<Settings> | ((prev: Settings) => Settings)) => void;
  reset: () => void;
  subscribe: (listener: Listener) => () => void;
}

export function createSettingsStore(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> | null
): SettingsStore {
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
        // Storage unavailable: the defaults still apply for this tab.
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
    browserStore = createSettingsStore(browserStorage());
  }
  return browserStore;
}
