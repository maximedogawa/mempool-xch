/**
 * Public CEX order books for XCH (decision on the market view, TASK-091). Prices are bigint
 * fixed point (see ./decimal); level amounts are XCH as plain numbers, used only for depth sizes.
 */
import { divRound, parseScaled, ratioPpm } from "./decimal";

export type MarketQuote = "USDT" | "USDC";
export type Exchange = "Gate" | "OKX" | "HTX";

export const EXCHANGES: readonly Exchange[] = ["Gate", "OKX", "HTX"];

/**
 * Which exchange lists which XCH pair, checked 2026-09-23 against each public API: Gate and HTX
 * answer XCH_USDC / xchusdc with "invalid currency pair" / "invalid symbol"; only OKX lists it.
 */
export const LISTINGS: Record<Exchange, readonly MarketQuote[]> = {
  Gate: ["USDT"],
  OKX: ["USDT", "USDC"],
  HTX: ["USDT"],
};

export function lists(exchange: Exchange, quote: MarketQuote): boolean {
  return LISTINGS[exchange].includes(quote);
}

/** Levels kept per side; enough to span roughly ±2 % around the mid on every listed book. */
export const BOOK_DEPTH = 50;

export interface MarketLevel {
  priceScaled: bigint;
  amount: number;
}

export interface MarketBook {
  exchange: Exchange;
  quote: MarketQuote;
  bids: MarketLevel[];
  asks: MarketLevel[];
  at: number;
}

export function level(value: unknown): MarketLevel | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const priceScaled = parseScaled(value[0]);
  const amount = Number(value[1]);
  return priceScaled !== null && priceScaled > 0n && Number.isFinite(amount) && amount > 0
    ? { priceScaled, amount }
    : null;
}

export function levels(value: unknown, descending: boolean): MarketLevel[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(level)
    .filter((v): v is MarketLevel => v !== null)
    .sort((a, b) => {
      if (a.priceScaled === b.priceScaled) return 0;
      return (descending ? b.priceScaled > a.priceScaled : a.priceScaled > b.priceScaled) ? 1 : -1;
    })
    .slice(0, BOOK_DEPTH);
}

function book(
  exchange: Exchange,
  quote: MarketQuote,
  at: number,
  side: { bids?: unknown; asks?: unknown } | undefined
): MarketBook {
  return {
    exchange,
    quote,
    bids: levels(side?.bids, true),
    asks: levels(side?.asks, false),
    at,
  };
}

/** Gate `/api/v4/spot/order_book`: `{ bids: [["1.63","2.7"]], asks }`. */
export function parseGateBook(raw: unknown, quote: MarketQuote, at: number): MarketBook {
  return book("Gate", quote, at, raw as { bids?: unknown; asks?: unknown });
}

/** OKX `/api/v5/market/books`: `{ data: [{ bids: [[px, sz, "0", orders]], asks }] }`. */
export function parseOkxBook(raw: unknown, quote: MarketQuote, at: number): MarketBook {
  return book(
    "OKX",
    quote,
    at,
    (raw as { data?: Array<{ bids?: unknown; asks?: unknown }> })?.data?.[0]
  );
}

/** HTX `/market/depth`: `{ tick: { bids: [[1.6345, 1.34]], asks } }` with JSON numbers. */
export function parseHtxBook(raw: unknown, quote: MarketQuote, at: number): MarketBook {
  return book("HTX", quote, at, (raw as { tick?: { bids?: unknown; asks?: unknown } })?.tick);
}

/**
 * The error an exchange reports inside a 200 response, if any: OKX `code` other than "0",
 * HTX `status: "error"`, Gate's `label` (Gate also sets a 4xx status).
 */
export function apiError(raw: unknown): string | null {
  const r = raw as Record<string, unknown> | null;
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  if (typeof r.code === "string" && r.code !== "0") return String(r.msg || `code ${r.code}`);
  if (r.status === "error") return String(r["err-msg"] ?? r["err-code"] ?? "error");
  if (typeof r.label === "string") return String(r.message ?? r.label);
  return null;
}

export function parseBook(
  exchange: Exchange,
  raw: unknown,
  quote: MarketQuote,
  at: number
): MarketBook {
  if (exchange === "Gate") return parseGateBook(raw, quote, at);
  if (exchange === "OKX") return parseOkxBook(raw, quote, at);
  return parseHtxBook(raw, quote, at);
}

export function bestBid(book: MarketBook | null): MarketLevel | null {
  return book?.bids[0] ?? null;
}

export function bestAsk(book: MarketBook | null): MarketLevel | null {
  return book?.asks[0] ?? null;
}

export function midPrice(
  bid: bigint | null | undefined,
  ask: bigint | null | undefined
): bigint | null {
  return bid !== null && bid !== undefined && ask !== null && ask !== undefined
    ? divRound(bid + ask, 2n)
    : null;
}

export interface Spread {
  /** ask − bid, scaled like prices. */
  absolute: bigint;
  /** (ask − bid) / mid in parts per million. */
  ppm: bigint;
}

export function spreadOf(
  bid: bigint | null | undefined,
  ask: bigint | null | undefined
): Spread | null {
  const mid = midPrice(bid, ask);
  if (mid === null || mid === 0n) return null;
  const absolute = ask! - bid!;
  return { absolute, ppm: ratioPpm(absolute, mid)! };
}

export function spread(book: MarketBook | null): Spread | null {
  return spreadOf(bestBid(book)?.priceScaled, bestAsk(book)?.priceScaled);
}

export interface CrossBest {
  bid: (MarketLevel & { exchange: Exchange }) | null;
  ask: (MarketLevel & { exchange: Exchange }) | null;
}

/** The highest bid and lowest ask over the given (live) books, with the exchange that has them. */
export function crossExchange(books: MarketBook[]): CrossBest {
  let bid: CrossBest["bid"] = null;
  let ask: CrossBest["ask"] = null;
  for (const b of books) {
    const top = b.bids[0];
    if (top && (!bid || top.priceScaled > bid.priceScaled)) bid = { ...top, exchange: b.exchange };
    const low = b.asks[0];
    if (low && (!ask || low.priceScaled < ask.priceScaled)) ask = { ...low, exchange: b.exchange };
  }
  return { bid, ask };
}

export interface Comparison {
  /** a − b, scaled like prices. */
  absolute: bigint;
  /** (a − b) / b in parts per million. */
  ppm: bigint;
}

/** Signed difference of two scaled prices, absolute and relative to `b`. */
export function compare(
  a: bigint | null | undefined,
  b: bigint | null | undefined
): Comparison | null {
  if (a === null || a === undefined || b === null || b === undefined || b === 0n) return null;
  return { absolute: a - b, ppm: ratioPpm(a - b, b)! };
}
