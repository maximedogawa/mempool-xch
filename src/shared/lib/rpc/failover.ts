/**
 * Automatic fallback for the hosted nodexch gateway (TASK-113, nodexch TASK-057 AC 2): reads go to
 * nodexch.space first; when it fails they go to Coinset, which speaks the same dialect on one host,
 * so a request moves by swapping the origin and dropping the nodexch key. The fallback is visible
 * (state + subscribe) and ends by itself: while on it, the owner probes the primary and calls
 * recover() once it answers.
 *
 * What moves the app to the fallback: a network error, a timeout, 5xx, 401, 403 or 429 from the
 * primary. A 501 ("index not enabled") moves only that request, since the gateway itself is fine.
 * Any other answer (a 404 for an unknown coin, say) is an answer, not a failure. A request the
 * caller aborted is never a failure.
 */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface FailoverState {
  onFallback: boolean;
  /** Why the primary was left, e.g. "HTTP 503" or "timeout"; null on the primary. */
  reason: string | null;
  /** When the fallback started (ms); null on the primary. */
  since: number | null;
}

export interface Failover {
  get: () => FailoverState;
  subscribe: (listener: () => void) => () => void;
  /** Use as the primary client's fetch: routes to the fallback when it has to. */
  fetch: FetchLike;
  /** The primary answered again: back to it. */
  recover: () => void;
}

const SWITCH_STATUSES = new Set([401, 403, 429]);

export function createFailover({
  primary,
  fallback,
  fetch: base,
  timeoutMs = 8_000,
  now = Date.now,
}: {
  /** The primary origin, e.g. https://nodexch.space. */
  primary: string;
  /** The fallback origin, e.g. https://api.coinset.org. */
  fallback: string;
  fetch: FetchLike;
  /** How long the primary may take before the request moves to the fallback. */
  timeoutMs?: number;
  now?: () => number;
}): Failover {
  const primaryOrigin = primary.replace(/\/$/, "");
  const fallbackOrigin = fallback.replace(/\/$/, "");
  let state: FailoverState = { onFallback: false, reason: null, since: null };
  const listeners = new Set<() => void>();
  const set = (next: FailoverState) => {
    state = next;
    listeners.forEach((l) => l());
  };
  const fail = (reason: string) => {
    if (!state.onFallback) set({ onFallback: true, reason, since: now() });
  };

  /** The same request on the fallback: its origin, no nodexch key. */
  const onFallback = (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.delete("authorization");
    return base(fallbackOrigin + url.slice(primaryOrigin.length), { ...init, headers });
  };

  const fetchWithFailover: FetchLike = async (input, init) => {
    const url = String(input);
    if (!url.startsWith(primaryOrigin)) return base(url, init);
    if (state.onFallback) return onFallback(url, init);

    const controller = new AbortController();
    const outer = init?.signal;
    const abort = () => controller.abort(outer?.reason);
    if (outer?.aborted) abort();
    else outer?.addEventListener("abort", abort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
    try {
      const response = await base(url, { ...init, signal: controller.signal });
      if (response.status >= 500 && response.status !== 501) {
        fail(`HTTP ${response.status}`);
        return onFallback(url, init);
      }
      if (SWITCH_STATUSES.has(response.status)) {
        fail(`HTTP ${response.status}`);
        return onFallback(url, init);
      }
      // The gateway runs without an index: only this request needs Coinset.
      if (response.status === 501) return onFallback(url, init);
      return response;
    } catch (error) {
      // The caller gave up: not the primary's fault.
      if (outer?.aborted) throw error;
      fail(timedOut ? "timeout" : "unreachable");
      return onFallback(url, init);
    } finally {
      clearTimeout(timer);
      outer?.removeEventListener("abort", abort);
    }
  };

  return {
    get: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    fetch: fetchWithFailover,
    recover: () => {
      if (state.onFallback) set({ onFallback: false, reason: null, since: null });
    },
  };
}
