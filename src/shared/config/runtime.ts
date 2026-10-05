/**
 * Settings the server hands the browser at run time instead of baking them into the bundle: the
 * site's main API, its fallback and its nodexch keys come from the container's environment (ONCE:
 * `once update <host> --env`), so one image serves any deployment and a setting changes without
 * a rebuild.
 *
 * The standalone server answers /runtime-config.js (src/app/runtime-config.js/route.ts) with one
 * assignment to a global; the root layout loads it before any app module runs. The static Sage
 * export has no server and no such script: there the global is missing and every value is empty.
 */

/** A nodexch publishable key: safe in a browser because the gateway binds it to origins. */
export const PUBLISHABLE_KEY = /^nxp_[A-Za-z0-9_-]{16,128}$/;

export const RUNTIME_CONFIG_PATH = "/runtime-config.js";
const GLOBAL = "__MEMPOOL_RUNTIME__";

export interface RuntimeConfig {
  /** The site's publishable nodexch key per network id; absent without one. */
  nodexchKeys: Record<string, string>;
  /** Mainnet's main API (API_URL_MAINNET): where a visitor's reads start; absent = built in. */
  apiUrl?: string;
  /** Where mainnet reads go when the main API fails (API_FALLBACK_URL_MAINNET); absent = nowhere. */
  fallbackUrl?: string;
}

/** Network id → the server environment variable that holds the site's key for it. */
const NODEXCH_KEY_ENV: Record<string, string> = {
  mainnet: "NODEXCH_KEY_MAINNET",
  testnet11: "NODEXCH_KEY_TESTNET11",
};

/** What the server exposes from its environment. Only a publishable key ever leaves it. */
export function runtimeConfigFromEnv(env: Record<string, string | undefined>): RuntimeConfig {
  const nodexchKeys: Record<string, string> = {};
  for (const [network, name] of Object.entries(NODEXCH_KEY_ENV)) {
    const key = env[name]?.trim() ?? "";
    if (PUBLISHABLE_KEY.test(key)) nodexchKeys[network] = key;
  }
  const config: RuntimeConfig = { nodexchKeys };
  const apiUrl = endpointUrl(env.API_URL_MAINNET);
  if (apiUrl) config.apiUrl = apiUrl;
  const fallbackUrl = endpointUrl(env.API_FALLBACK_URL_MAINNET);
  if (fallbackUrl && fallbackUrl !== apiUrl) config.fallbackUrl = fallbackUrl;
  return config;
}

/**
 * An endpoint base URL without its trailing slash; empty for anything else. https only, plain
 * http for a local node: a visitor's browser must be able to call it from the https site.
 */
function endpointUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol !== "https:" && !(local && url.protocol === "http:")) return "";
    if (url.username || url.password || url.search || url.hash) return "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

/** The body of /runtime-config.js. */
export function runtimeConfigScript(config: RuntimeConfig): string {
  return `globalThis.${GLOBAL}=${JSON.stringify(config)};`;
}

/** The site's nodexch key for a network as the server handed it over; empty without one. */
export function runtimeNodexchKey(network: string): string {
  const key = runtimeConfig()?.nodexchKeys?.[network];
  return typeof key === "string" && PUBLISHABLE_KEY.test(key) ? key : "";
}

function runtimeConfig(): Partial<RuntimeConfig> | undefined {
  return (globalThis as { [GLOBAL]?: Partial<RuntimeConfig> })[GLOBAL];
}

/** Mainnet's main API as the server handed it over; empty without one. */
export function runtimeApiUrl(): string {
  return endpointUrl(runtimeConfig()?.apiUrl);
}

/** Mainnet's fallback API as the server handed it over; empty without one. */
export function runtimeFallbackUrl(): string {
  return endpointUrl(runtimeConfig()?.fallbackUrl);
}
