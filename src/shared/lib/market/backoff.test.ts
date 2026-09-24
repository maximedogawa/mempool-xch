import { describe, expect, test } from "bun:test";
import {
  BACKOFF_BASE_MS,
  BACKOFF_MAX_MS,
  canPoll,
  HEALTHY,
  HttpError,
  parseRetryAfter,
  recordFailure,
  recordSuccess,
} from "./backoff";

describe("market polling back-off", () => {
  test("doubles per failure up to the cap and resets on success", () => {
    let h = HEALTHY;
    const delays: number[] = [];
    for (let i = 0; i < 8; i++) {
      h = recordFailure(h, 0, new HttpError(503));
      delays.push(h.retryAt);
    }
    expect(delays.slice(0, 4)).toEqual([10_000, 20_000, 40_000, 80_000]);
    expect(delays.at(-1)).toBe(BACKOFF_MAX_MS);
    expect(canPoll(h, BACKOFF_MAX_MS - 1)).toBe(false);
    expect(canPoll(h, BACKOFF_MAX_MS)).toBe(true);
    expect(recordSuccess()).toEqual(HEALTHY);
  });

  test("a 429 honours a longer Retry-After; a network error backs off like a 5xx", () => {
    expect(recordFailure(HEALTHY, 0, new HttpError(429, 60_000)).retryAt).toBe(60_000);
    expect(recordFailure(HEALTHY, 0, new HttpError(429, 1_000)).retryAt).toBe(BACKOFF_BASE_MS);
    expect(recordFailure(HEALTHY, 0, new TypeError("Failed to fetch")).retryAt).toBe(
      BACKOFF_BASE_MS
    );
  });

  test("other 4xx (an unlisted pair) waits the cap", () => {
    expect(recordFailure(HEALTHY, 0, new HttpError(400)).retryAt).toBe(BACKOFF_MAX_MS);
  });

  test("parses Retry-After seconds and dates", () => {
    expect(parseRetryAfter("30", 0)).toBe(30_000);
    expect(parseRetryAfter("Wed, 23 Sep 2026 10:00:10 GMT", Date.UTC(2026, 8, 23, 10, 0, 0))).toBe(
      10_000
    );
    expect(parseRetryAfter(null, 0)).toBeNull();
    expect(parseRetryAfter("soon", 0)).toBeNull();
  });
});
