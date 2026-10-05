/**
 * Public trades (fills) from the CEX trade endpoints. `side` is the taker side as every exchange
 * reports it: a taker buy lifts an ask (the sellers' side is hit), a taker sell hits a bid.
 */
import { parseScaled } from "./decimal";
import type { Exchange, MarketQuote } from "./orderbook";

export type TakerSide = "buy" | "sell";

export interface MarketTrade {
  exchange: Exchange;
  quote: MarketQuote;
  id: string;
  priceScaled: bigint;
  amount: number;
  side: TakerSide;
  at: number;
}

/** The book side a trade took liquidity from. */
export function hitSide(trade: Pick<MarketTrade, "side">): "bids" | "asks" {
  return trade.side === "buy" ? "asks" : "bids";
}

function trade(
  exchange: Exchange,
  quote: MarketQuote,
  id: unknown,
  price: unknown,
  amount: unknown,
  side: unknown,
  at: unknown
): MarketTrade | null {
  const priceScaled = parseScaled(price);
  const size = Number(amount);
  const time = Number(at);
  if (
    priceScaled === null ||
    priceScaled <= 0n ||
    !Number.isFinite(size) ||
    size <= 0 ||
    !Number.isFinite(time) ||
    (side !== "buy" && side !== "sell") ||
    (typeof id !== "string" && typeof id !== "number")
  )
    return null;
  return {
    exchange,
    quote,
    id: String(id),
    priceScaled,
    amount: size,
    side,
    at: Math.floor(time),
  };
}

function compact(list: Array<MarketTrade | null>): MarketTrade[] {
  return list.filter((t): t is MarketTrade => t !== null).sort((a, b) => b.at - a.at);
}

/** Gate `/api/v4/spot/trades`: `[{ id, create_time_ms: "1790157017071.909", side, amount, price }]`. */
export function parseGateTrades(raw: unknown, quote: MarketQuote): MarketTrade[] {
  if (!Array.isArray(raw)) return [];
  return compact(
    raw.map((t: Record<string, unknown>) =>
      trade("Gate", quote, t?.id, t?.price, t?.amount, t?.side, t?.create_time_ms)
    )
  );
}

/** OKX `/api/v5/market/trades`: `{ data: [{ tradeId, px, sz, side, ts }] }`. */
export function parseOkxTrades(raw: unknown, quote: MarketQuote): MarketTrade[] {
  const data = (raw as { data?: unknown })?.data;
  if (!Array.isArray(data)) return [];
  return compact(
    data.map((t: Record<string, unknown>) =>
      trade("OKX", quote, t?.tradeId, t?.px, t?.sz, t?.side, t?.ts)
    )
  );
}

/**
 * HTX `/market/history/trade`: `{ data: [{ data: [{ "trade-id", price, amount, direction, ts }] }] }`.
 * The inner `id` exceeds 2^53, so the numeric `trade-id` is used instead.
 */
export function parseHtxTrades(raw: unknown, quote: MarketQuote): MarketTrade[] {
  const groups = (raw as { data?: unknown })?.data;
  if (!Array.isArray(groups)) return [];
  return compact(
    groups.flatMap((g: { data?: unknown }) =>
      Array.isArray(g?.data)
        ? g.data.map((t: Record<string, unknown>) =>
            trade("HTX", quote, t?.["trade-id"], t?.price, t?.amount, t?.direction, t?.ts)
          )
        : []
    )
  );
}

export function parseTrades(exchange: Exchange, raw: unknown, quote: MarketQuote): MarketTrade[] {
  if (exchange === "Gate") return parseGateTrades(raw, quote);
  if (exchange === "OKX") return parseOkxTrades(raw, quote);
  return parseHtxTrades(raw, quote);
}

export const TAPE_LIMIT = 40;

export function tradeKey(t: Pick<MarketTrade, "exchange" | "id">): string {
  return `${t.exchange}:${t.id}`;
}

/**
 * Merge freshly polled trades into the tape (newest first, capped). Returns the trades that were
 * not on the tape before, oldest first, so they can be replayed as hits in the order they happened.
 */
export function mergeTape(
  tape: MarketTrade[],
  incoming: MarketTrade[],
  limit = TAPE_LIMIT
): { tape: MarketTrade[]; fresh: MarketTrade[] } {
  const known = new Set(tape.map(tradeKey));
  const newestKnown = new Map<Exchange, number>();
  for (const t of tape)
    newestKnown.set(t.exchange, Math.max(newestKnown.get(t.exchange) ?? 0, t.at));
  const fresh: MarketTrade[] = [];
  for (const t of incoming) {
    const key = tradeKey(t);
    if (known.has(key)) continue;
    known.add(key);
    // A trade older than what the tape already holds for this exchange was merely cut off by a
    // previous cap; it is not new.
    if (t.at < (newestKnown.get(t.exchange) ?? 0)) continue;
    fresh.push(t);
  }
  const merged = [...fresh, ...tape].sort((a, b) => b.at - a.at).slice(0, limit);
  return { tape: merged, fresh: fresh.sort((a, b) => a.at - b.at) };
}

export interface TakerShare {
  buy: number;
  sell: number;
  /** Buy share of the traded XCH, 0…1; null without trades. */
  buyShare: number | null;
}

/** Taker buy and sell volume (XCH) over the trades since `since`. */
export function takerShare(tape: MarketTrade[], since = 0): TakerShare {
  let buy = 0;
  let sell = 0;
  for (const t of tape) {
    if (t.at < since) continue;
    if (t.side === "buy") buy += t.amount;
    else sell += t.amount;
  }
  const total = buy + sell;
  return { buy, sell, buyShare: total > 0 ? buy / total : null };
}
