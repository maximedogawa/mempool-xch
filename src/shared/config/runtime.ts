/**
 * Settings the server hands the browser at run time instead of baking them into the bundle: the
 * site's nodexch keys come from the container's environment (ONCE: `once update <host> --env`),
 * so one image serves any deployment and a key changes without a rebuild.
 *
 * The standalone server answers /runtime-config.js (src/app/runtime-config.js/route.ts) with one
 * assignment to a global; the root layout loads it before any app module runs. The static Sage
 * export has no server and no such script: there the global is missing and every key is empty.
 */

/** A nodexch publishable key: safe in a browser because the gateway binds it to origins. */
export const PUBLISHABLE_KEY = /^nxp_[A-Za-z0-9_-]{16,128}$/;

export const RUNTIME_CONFIG_PATH = "/runtime-config.js";
const GLOBAL = "__MEMPOOL_RUNTIME__";

export interface RuntimeConfig {
  /** The site's publishable nodexch key per network id; absent without one. */
  nodexchKeys: Record<string, string>;
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
  return { nodexchKeys };
}

/** The body of /runtime-config.js. */
export function runtimeConfigScript(config: RuntimeConfig): string {
  return `globalThis.${GLOBAL}=${JSON.stringify(config)};`;
}

/** The site's nodexch key for a network as the server handed it over; empty without one. */
export function runtimeNodexchKey(network: string): string {
  const config = (globalThis as { [GLOBAL]?: Partial<RuntimeConfig> })[GLOBAL];
  const key = config?.nodexchKeys?.[network];
  return typeof key === "string" && PUBLISHABLE_KEY.test(key) ? key : "";
}
