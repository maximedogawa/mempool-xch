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

/** A used-up monthly quota: asking again before it renews only adds refusals. */
function quotaExceeded(error: RpcError): boolean {
  return typeof error.detail === "string" && /quota_exceeded/.test(error.detail);
}

export const PACED_MIN_GAP_MS = 250;
export const PACED_RETRY_AFTER_DEFAULT_MS = 5_000;
export const PACED_RETRY_AFTER_MAX_MS = 60_000;
export const PACED_QUOTA_PAUSE_MS = 5 * 60_000;

/**
 * Calls to a nodexch gateway, which counts every request against a rate a minute and a quota a
 * month (TASK-115): a few in flight, never closer together than `minGapMs`, and when the
 * gateway says 429 everything waits for as long as it asked (`retry-after`) instead of asking
 * again at once. A refused call is tried once more after that wait, a failed one (network,
 * 5xx) once after a pause; a used-up quota is not retried at all and holds every call back for
 * a while. The error is then marked so that TanStack Query does not retry it on top.
 *
 * Better than a refusal is not being refused: every answer says the key's rate a minute and
 * what is left of it (`x-ratelimit-limit`, `x-ratelimit-remaining`; `observe`). With little
 * left, calls start one refill apart (a minute over the rate: 6 s on a plan of 10 a minute)
 * instead of running into 429s.
 */
export function createPacedGate({
  concurrency = 4,
  minGapMs = PACED_MIN_GAP_MS,
  now = Date.now,
  delay = abortableDelay,
  jitter = () => Math.random() * 250,
}: {
  concurrency?: number;
  minGapMs?: number;
  now?: () => number;
  delay?: typeof abortableDelay;
  jitter?: () => number;
} = {}) {
  const limit = createLimiter(concurrency);
  let holdUntil = 0;
  let nextStart = 0;
  /** The gap between starts: `minGapMs`, or one refill while the key's rate is nearly used. */
  let gapMs = minGapMs;
  let lastStart = -Infinity;
  /** Waits out the hold, then takes the next start slot, `gapMs` after the one before. */
  const turn = async (signal?: AbortSignal) => {
    for (;;) {
      signal?.throwIfAborted();
      const at = Math.max(holdUntil, nextStart);
      if (now() >= at) break;
      await delay(at - now(), signal);
    }
    lastStart = now();
    nextStart = lastStart + gapMs;
  };
  const gate = <T>(read: () => Promise<T>, signal?: AbortSignal): Promise<T> =>
    limit(async () => {
      for (let attempt = 0; ; attempt++) {
        await turn(signal);
        try {
          return await read();
        } catch (error) {
          signal?.throwIfAborted();
          if (!(error instanceof RpcError)) throw error;
          const refused = error.kind === "http" && error.status === 429;
          const failed =
            error.kind === "network" ||
            (error.kind === "http" && error.status !== undefined && error.status >= 500);
          if (!refused && !failed) throw error;
          const quota = refused && quotaExceeded(error);
          const wait = quota
            ? PACED_QUOTA_PAUSE_MS
            : refused
              ? Math.min(
                  error.retryAfterMs ?? PACED_RETRY_AFTER_DEFAULT_MS,
                  PACED_RETRY_AFTER_MAX_MS
                )
              : (attempt === 0 ? 1_000 : 3_000) + jitter();
          holdUntil = Math.max(holdUntil, now() + wait);
          if (quota || attempt >= 1) {
            error.retryHandled = true;
            throw error;
          }
        }
      }
    }, signal);
  /** What an answer said of the key's rate: requests a minute, and how many are left now. */
  const observe = (perMinute: number, remaining: number) => {
    if (!Number.isFinite(perMinute) || perMinute <= 0 || !Number.isFinite(remaining)) return;
    const refillMs = 60_000 / perMinute;
    // Calls already in flight take from what is left too: slow down before it is gone.
    const low = remaining <= concurrency;
    gapMs = low ? Math.max(minGapMs, refillMs) : minGapMs;
    // Plenty left again: the next call need not wait out a slow slot taken before.
    nextStart = low ? Math.max(nextStart, now() + gapMs) : Math.min(nextStart, lastStart + gapMs);
    if (remaining <= 0) holdUntil = Math.max(holdUntil, now() + refillMs);
  };
  return Object.assign(gate, { observe });
}
