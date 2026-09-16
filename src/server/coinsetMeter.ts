/**
 * Counts every server-side call to Coinset (TASK-037): totals per method and a sliding
 * one-minute rate, exposed on /api/<network>/status so the load figures in the wiki come from
 * the running server rather than from estimates.
 */
export interface MeterSnapshot {
  total: number;
  byMethod: Record<string, number>;
  /** Calls in the last 60 s. */
  lastMinute: number;
  /** Average calls per minute since the server started. */
  perMinuteSinceStart: number;
  startedAt: number;
}

export class CoinsetMeter {
  private total = 0;
  private readonly byMethod: Record<string, number> = {};
  private readonly recent: number[] = [];
  private readonly startedAt: number;

  constructor(private readonly now: () => number = () => Date.now()) {
    this.startedAt = this.now();
  }

  record(method: string): void {
    const t = this.now();
    this.total += 1;
    this.byMethod[method] = (this.byMethod[method] ?? 0) + 1;
    this.recent.push(t);
    while (this.recent.length > 0 && t - this.recent[0]! > 60_000) this.recent.shift();
  }

  snapshot(): MeterSnapshot {
    const t = this.now();
    while (this.recent.length > 0 && t - this.recent[0]! > 60_000) this.recent.shift();
    const minutes = Math.max(1 / 60, (t - this.startedAt) / 60_000);
    return { total: this.total, byMethod: { ...this.byMethod }, lastMinute: this.recent.length, perMinuteSinceStart: Math.round((this.total / minutes) * 10) / 10, startedAt: this.startedAt };
  }
}

export const coinsetMeter = new CoinsetMeter();

/** fetch wrapper that records the RPC method (last path segment) before delegating. */
export function meteredFetch(meter: CoinsetMeter = coinsetMeter, fetchImpl: typeof fetch = fetch): typeof fetch {
  return ((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    meter.record(url.split("?")[0]!.split("/").pop() ?? "?");
    return fetchImpl(input, init);
  }) as typeof fetch;
}
