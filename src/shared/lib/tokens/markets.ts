/**
 * CAT market data from Dexie, all tokens in one request. Verified 2026-09-20:
 * https://api.dexie.space/v3/prices/tickers answers with `access-control-allow-origin: *` and
 * one ticker per traded CAT/XCH pair (539 on mainnet): last and average price in XCH, and the
 * traded volume over 24 hours, 7 and 30 days, each both in the token (base) and in XCH (target).
 * The tokens page reads the XCH side: a token amount says nothing across tokens, XCH compares.
 * These are display figures from a third party, hence plain numbers and not mojos.
 */
export const DEXIE_TICKERS_URL = "https://api.dexie.space/v3/prices/tickers";

export type VolumeWindow = "d1" | "d7" | "d30";

export interface TokenMarket {
  assetId: string;
  /** Last traded price of one token, in XCH. */
  lastPriceXch: number | null;
  /** XCH traded against this token per window. */
  volumeXch: Record<VolumeWindow, number>;
  bidXch: number | null;
  askXch: number | null;
  high30dXch: number | null;
  low30dXch: number | null;
}

export type TokenMarketMap = Record<string, TokenMarket>;

type Raw = Record<string, unknown>;

/** Dexie sends decimals as strings; null, "" and non-finite values all mean "no figure". */
export function dexieNumber(v: unknown): number | null {
  if (typeof v !== "number" && (typeof v !== "string" || !v.trim())) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function normaliseTickers(raw: unknown): TokenMarketMap {
  const tickers =
    raw && typeof raw === "object" && Array.isArray((raw as Raw).tickers)
      ? ((raw as Raw).tickers as unknown[])
      : [];
  const map: TokenMarketMap = {};
  tickers.forEach((entry) => {
    const t = entry && typeof entry === "object" ? (entry as Raw) : {};
    if (String(t.target_currency).toLowerCase() !== "xch") return;
    const assetId = String(t.base_currency ?? "")
      .toLowerCase()
      .replace(/^0x/, "");
    if (!/^[0-9a-f]{64}$/.test(assetId)) return;
    const price = dexieNumber(t.last_price);
    map[assetId] = {
      assetId,
      lastPriceXch: price !== null && price > 0 ? price : null,
      volumeXch: {
        d1: dexieNumber(t.target_volume) ?? 0,
        d7: dexieNumber(t.target_volume_7d) ?? 0,
        d30: dexieNumber(t.target_volume_30d) ?? 0,
      },
      bidXch: dexieNumber(t.bid),
      askXch: dexieNumber(t.ask),
      high30dXch: dexieNumber(t.high_30d),
      low30dXch: dexieNumber(t.low_30d),
    };
  });
  return map;
}

export async function fetchTokenMarkets(
  fetchImpl: (url: string, init?: RequestInit) => Promise<Pick<Response, "ok" | "status" | "json">>,
  signal?: AbortSignal
): Promise<TokenMarketMap> {
  const response = await fetchImpl(DEXIE_TICKERS_URL, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Dexie tickers answered ${response.status}`);
  return normaliseTickers(await response.json());
}

/** An XCH figure for a table cell: whole numbers when large, four significant digits when small. */
export function formatXchFigure(value: number): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (abs >= 1) return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  if (abs < 1e-9) return value.toExponential(2);
  return value.toLocaleString("en-US", { maximumSignificantDigits: 4 });
}
