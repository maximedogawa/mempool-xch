import { createLimiter } from "@/shared/lib/limit";
import { RpcError } from "./errors";

export function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal!.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * All Coinset reads share slots and an outage cooldown: dashboard polling, the mempool catch-up,
 * token scans and block totals. Measured against api.coinset.org (2026-09-20): 3 in flight gave
 * no 503 in 60 calls, 7 gave 1 in 140, 11 gave 5 in 240.
 */
export function createReadGate({
  concurrency = 5,
  now = Date.now,
  delay = abortableDelay,
  jitter = () => Math.random() * 250,
}: {
  concurrency?: number;
  now?: () => number;
  delay?: typeof abortableDelay;
  jitter?: () => number;
} = {}) {
  const limit = createLimiter(concurrency);
  let cooldownUntil = 0;
  return <T>(read: () => Promise<T>, signal?: AbortSignal): Promise<T> =>
    limit(async () => {
      for (let attempt = 0; ; attempt++) {
        // Another failed request can extend the shared cooldown while this one waits.
        while (now() < cooldownUntil) await delay(cooldownUntil - now(), signal);
        signal?.throwIfAborted();
        try {
          return await read();
        } catch (error) {
          signal?.throwIfAborted();
          const transient =
            error instanceof RpcError &&
            (error.kind === "network" ||
              (error.kind === "http" &&
                (error.status === 429 || (error.status !== undefined && error.status >= 500))));
          if (!transient) throw error;
          cooldownUntil = Math.max(cooldownUntil, now() + (attempt === 0 ? 1000 : 3000) + jitter());
          if (attempt >= 1) {
            error.retryHandled = true;
            throw error;
          }
        }
      }
    }, signal);
}
