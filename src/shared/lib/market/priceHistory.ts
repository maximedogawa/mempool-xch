/**
 * XCH/USDT price history from Gate.io's public spot candlesticks: CORS-reachable from the
 * browser, already on the Sage network whitelist for the market page, no key needed.
 * https://www.gate.io/docs/developers/apiv4/#market-candlesticks
 */
import type { RangeId } from "@/shared/lib/charts/range";
import type { Point } from "@/shared/lib/charts/smoothing";

/** Candle width and count per chart range: 70 to 370 points, "All" at weekly candles. */
const CANDLES: Record<RangeId, { interval: string; limit: number }> = {
  "6h": { interval: "5m", limit: 72 },
  "24h": { interval: "15m", limit: 96 },
  "7d": { interval: "1h", limit: 168 },
  "30d": { interval: "4h", limit: 180 },
  "1y": { interval: "1d", limit: 365 },
  all: { interval: "7d", limit: 1000 },
};

export function gateCandlesUrl(range: RangeId): string {
  const { interval, limit } = CANDLES[range];
  return `https://api.gateio.ws/api/v4/spot/candlesticks?currency_pair=XCH_USDT&interval=${interval}&limit=${limit}`;
}

/**
 * Close price per candle. Each candle is an array of strings: [unix seconds, quote volume,
 * close, high, low, open, base volume, closed?]; malformed rows are skipped.
 */
export function parseGateCandles(body: unknown): Point[] {
  if (!Array.isArray(body)) throw new Error("Gate.io candlesticks: unexpected response");
  return body
    .map((row): Point | null => {
      if (!Array.isArray(row)) return null;
      const t = Number(row[0]) * 1000;
      const close = Number(row[2]);
      return Number.isFinite(t) && t > 0 && Number.isFinite(close) && close > 0
        ? { t, v: close }
        : null;
    })
    .filter((p): p is Point => p !== null)
    .sort((a, b) => a.t - b.t);
}

export async function fetchPriceHistory(range: RangeId, signal?: AbortSignal): Promise<Point[]> {
  const response = await fetch(gateCandlesUrl(range), {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Gate.io candlesticks answered ${response.status}`);
  return parseGateCandles(await response.json());
}
