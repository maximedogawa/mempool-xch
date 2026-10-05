/**
 * Dexie through a nodexch gateway (nodexch TASK-056 and TASK-057 AC 2): the gateway answers the
 * Dexie API paths this app reads (`/v1/assets`, `/v1/offers`, `/v3/prices/tickers`) under `/dexie`
 * in Dexie's own shapes, so a request moves by swapping the origin and adding the nodexch key.
 * With a fallback named by the server (fallbackEndpointUrl) Dexie itself stays the fallback, per
 * request: a gateway that fails, times out or refuses is answered by api.dexie.space instead,
 * without the key, and the next request asks nodexch again. Without it the gateway's failure is
 * the answer.
 *
 * Icons (`icons.dexie.space/<asset id>.webp`) are on the gateway too, under `/dexie/icons/`: its
 * image routes need no key, since an `<img>` cannot send one (`nodexchDexieIconUrl`).
 */
import type { FetchLike } from "@/shared/lib/rpc/client";

export const DEXIE_API_ORIGIN = "https://api.dexie.space";

/** The gateway that answers Dexie's paths, and its publishable key. */
export interface DexieRoute {
  gateway: string;
  apiKey: string | null;
}

/** The same Dexie API request on the gateway; null for a URL that is not Dexie's API. */
export function nodexchDexieUrl(gateway: string, url: string): string | null {
  if (url !== DEXIE_API_ORIGIN && !url.startsWith(`${DEXIE_API_ORIGIN}/`)) return null;
  return `${gateway.replace(/\/$/, "")}/dexie${url.slice(DEXIE_API_ORIGIN.length)}`;
}

/** A CAT's icon on the gateway (`/dexie/icons/<asset id>.webp`): a public file, no key. */
export function nodexchDexieIconUrl(gateway: string, assetId: string): string {
  return `${gateway.replace(/\/$/, "")}/dexie/icons/${assetId.toLowerCase().replace(/^0x/, "")}.webp`;
}

/** The request as it goes to the gateway: its URL there and the key, which only nodexch sees. */
export function nodexchDexieRequest(
  route: DexieRoute,
  url: string,
  init?: RequestInit
): { url: string; init: RequestInit } | null {
  const routed = nodexchDexieUrl(route.gateway, url);
  if (!routed) return null;
  const headers = new Headers(init?.headers);
  if (route.apiKey) headers.set("authorization", `Bearer ${route.apiKey}`);
  return { url: routed, init: { ...init, headers } };
}

/** Dexie's own answers, which the gateway passes on: an answer, not a failure of the gateway. */
const DEXIE_ANSWERS = new Set([400, 404, 410]);

/**
 * A fetch for Dexie API URLs. `route` is read per request: the gateway while nodexch is the
 * provider, null for Dexie directly (Coinset, a custom node, a network without a gateway).
 */
export function createDexieFetch({
  route,
  fetch: base,
  fallback = true,
  timeoutMs = 8_000,
}: {
  route: () => DexieRoute | null;
  fetch: FetchLike;
  /** False: the gateway's answer or failure stands, Dexie is not asked behind it. */
  fallback?: boolean;
  /** How long the gateway may take before the request goes to Dexie. */
  timeoutMs?: number;
}): FetchLike {
  return async (input, init) => {
    const url = String(input);
    const current = route();
    const routed = current ? nodexchDexieRequest(current, url, init) : null;
    if (!routed) return base(url, init);

    const controller = new AbortController();
    const outer = init?.signal;
    const abort = () => controller.abort(outer?.reason);
    if (outer?.aborted) abort();
    else outer?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await base(routed.url, { ...routed.init, signal: controller.signal });
      if (!fallback || response.ok || DEXIE_ANSWERS.has(response.status)) return response;
    } catch (error) {
      // The caller gave up: not the gateway's fault.
      if (!fallback || outer?.aborted) throw error;
    } finally {
      clearTimeout(timer);
      outer?.removeEventListener("abort", abort);
    }
    return base(url, init);
  };
}
