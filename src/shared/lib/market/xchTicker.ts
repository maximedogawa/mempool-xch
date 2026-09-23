/**
 * XCH/USDT spot ticker from Gate.io: last price and the 24-hour change in one request. The host
 * is CORS-reachable and already on the Sage whitelist for the market page; no key needed.
 * https://www.gate.io/docs/developers/apiv4/#retrieve-ticker-information
 */
export const GATE_XCH_TICKER_URL =
  "https://api.gateio.ws/api/v4/spot/tickers?currency_pair=XCH_USDT";

export interface XchTicker {
  /** Last traded price of one XCH, in USD (USDT). */
  usd: number;
  /** Change over the last 24 hours as a ratio (0.0123 = +1.23 %); null when not reported. */
  change24h: number | null;
}

/** Gate answers an array with one ticker; `last` and `change_percentage` are decimal strings. */
export function parseGateTicker(body: unknown): XchTicker {
  const entry = Array.isArray(body) ? (body[0] as Record<string, unknown> | undefined) : undefined;
  const usd = Number(entry?.last);
  if (!entry || !Number.isFinite(usd) || usd <= 0)
    throw new Error("Gate.io ticker: unexpected response");
  const pct = entry.change_percentage;
  const change = typeof pct === "string" && pct.trim() ? Number(pct) : Number.NaN;
  return { usd, change24h: Number.isFinite(change) ? change / 100 : null };
}

export async function fetchXchTicker(signal?: AbortSignal): Promise<XchTicker> {
  const response = await fetch(GATE_XCH_TICKER_URL, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Gate.io ticker answered ${response.status}`);
  return parseGateTicker(await response.json());
}
