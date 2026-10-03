/**
 * User settings: active network, RPC endpoint per network, theme, language. Persisted in
 * localStorage; a tiny external store so React reads it with useSyncExternalStore and the
 * non-React data layer can read it too.
 */
import {
  NETWORKS,
  NODEXCH_AUTO_FALLBACK,
  NETWORK_IDS,
  defaultEndpointUrl,
  isNodexchUrl,
  providerOf,
  type NetworkId,
  type Provider,
} from "@/shared/config/networks";
import { browserStorage } from "@/shared/lib/browserStorage";
import { isLocale, type LocalePreference } from "@/shared/i18n/config";
import { DEFAULT_THEME, isThemeId, type ThemePreference } from "@/shared/theme";

export type { ThemePreference } from "@/shared/theme";

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

/**
 * 2: the default endpoint is the network's default provider (nodexch.space on mainnet); settings
 * written before (1) still hold the old Coinset default and move to it once.
 */
export const PROVIDERS_VERSION = 2;

export interface Settings {
  network: NetworkId;
  endpoints: Record<NetworkId, Endpoint>;
  /** Which endpoint defaults these settings were written with (PROVIDERS_VERSION). */
  providersVersion: number;
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
    mainnet: { rpcUrl: defaultEndpointUrl("mainnet") },
    testnet11: { rpcUrl: defaultEndpointUrl("testnet11") },
  },
  providersVersion: PROVIDERS_VERSION,
  theme: DEFAULT_THEME,
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
  /**
   * Where reads go when this endpoint fails: Coinset for the hosted nodexch gateway when the
   * build turns the automatic fallback on (NODEXCH_AUTO_FALLBACK), nothing otherwise and nothing
   * for an endpoint the visitor chose (a local node, their own gateway, Coinset itself).
   */
  fallback: ResolvedEndpoints | null;
}

/** Coinset for a network: the hosted gateway's fallback and the provider of the same name. */
export function coinsetEndpoints(network: NetworkId): ResolvedEndpoints {
  return {
    network,
    rpcUrl: NETWORKS[network].rpcUrl,
    indexedUrl: NETWORKS[network].indexedUrl,
    wsUrl: NETWORKS[network].wsUrl,
    provider: "coinset",
    isCoinset: true,
    apiKey: null,
    fallback: null,
  };
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
  network: NetworkId = settings.network,
  { autoFallback = NODEXCH_AUTO_FALLBACK }: { autoFallback?: boolean } = {}
): ResolvedEndpoints {
  const endpoint = settings.endpoints[network];
  const rpcUrl = (endpoint?.rpcUrl?.trim() || defaultEndpointUrl(network)).replace(/\/$/, "");
  const provider = providerOf(network, rpcUrl, endpoint?.provider);
  if (provider === "nodexch") {
    // The site's own key for the hosted gateway, the user's for theirs.
    const apiKey = endpoint?.apiKey || NETWORKS[network].nodexchKey || null;
    // The hosted gateway refuses every request without a key (401). Settings may still name it
    // (stored by a build that had the site's key, or picked without one): Coinset answers then.
    if (!apiKey && isNodexchUrl(network, rpcUrl)) return coinsetEndpoints(network);
    return {
      network,
      rpcUrl,
      indexedUrl: rpcUrl,
      wsUrl: nodexchWsUrl(rpcUrl, apiKey),
      provider,
      isCoinset: false,
      apiKey,
      fallback: autoFallback && isNodexchUrl(network, rpcUrl) ? coinsetEndpoints(network) : null,
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
    fallback: null,
  };
}

function sanitise(raw: unknown): Settings {
  const r = raw && typeof raw === "object" ? (raw as Partial<Settings>) : {};
  const network = NETWORK_IDS.includes(r.network as NetworkId)
    ? (r.network as NetworkId)
    : DEFAULT_SETTINGS.network;
  const written = typeof r.providersVersion === "number" ? r.providersVersion : 1;
  const endpoints = Object.fromEntries(
    NETWORK_IDS.map((id) => {
      const raw = r.endpoints?.[id];
      const url = typeof raw?.rpcUrl === "string" ? raw.rpcUrl.trim() : "";
      // Before version 2 the Coinset URL was simply the default nobody chose: move it to the
      // network's default provider once. A custom URL or an own gateway is a choice and stays.
      const oldDefault =
        written < PROVIDERS_VERSION &&
        url.replace(/\/$/, "") === NETWORKS[id].rpcUrl &&
        raw?.provider !== "nodexch";
      const endpoint: Endpoint = {
        rpcUrl: url && !oldDefault ? url : defaultEndpointUrl(id),
      };
      if (raw?.provider === "nodexch") endpoint.provider = "nodexch";
      // Only a publishable key is kept: a secret key must never sit in a browser.
      if (typeof raw?.apiKey === "string" && PUBLISHABLE_KEY.test(raw.apiKey.trim())) {
        endpoint.apiKey = raw.apiKey.trim();
      }
      return [id, endpoint];
    })
  ) as Settings["endpoints"];
  const theme: ThemePreference =
    r.theme === "system" || isThemeId(r.theme) ? r.theme : DEFAULT_THEME;
  const recentBlocks =
    typeof r.recentBlocks === "number" && r.recentBlocks >= 3 && r.recentBlocks <= 20
      ? r.recentBlocks
      : 8;
  const sounds = r.sounds !== false;
  const notifications = r.notifications === true;
  const locale: LocalePreference = isLocale(r.locale) ? r.locale : "auto";
  return {
    network,
    endpoints,
    providersVersion: PROVIDERS_VERSION,
    theme,
    recentBlocks,
    sounds,
    notifications,
    locale,
  };
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
