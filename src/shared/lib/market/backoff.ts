/**
 * Per-source polling health. A source that fails, is rate limited (429) or has a server error
 * (5xx) waits before its next request, doubling each time up to a cap; a Retry-After header wins
 * when it asks for longer. A 4xx other than 429 (for example an unlisted pair) waits the cap.
 */

export const BACKOFF_BASE_MS = 10_000;
export const BACKOFF_MAX_MS = 300_000;

export interface SourceHealth {
  failures: number;
  /** Epoch ms before which the source is not polled again. */
  retryAt: number;
}

export const HEALTHY: SourceHealth = { failures: 0, retryAt: 0 };

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly retryAfterMs: number | null = null
  ) {
    super(`HTTP ${status}`);
    this.name = "HttpError";
  }
}

/** Retry-After as delta seconds or an HTTP date, in ms from `now`. */
export function parseRetryAfter(value: string | null | undefined, now: number): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

export function canPoll(health: SourceHealth, now: number): boolean {
  return now >= health.retryAt;
}

export function recordSuccess(): SourceHealth {
  return HEALTHY;
}

export function recordFailure(health: SourceHealth, now: number, error: unknown): SourceHealth {
  const failures = health.failures + 1;
  let delay = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * 2 ** (failures - 1));
  if (error instanceof HttpError) {
    if (error.status >= 400 && error.status < 500 && error.status !== 429) delay = BACKOFF_MAX_MS;
    if (error.retryAfterMs !== null)
      delay = Math.max(delay, Math.min(error.retryAfterMs, 3_600_000));
  }
  return { failures, retryAt: now + delay };
}
