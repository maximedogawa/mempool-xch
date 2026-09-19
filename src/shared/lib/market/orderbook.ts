export type MarketQuote = "USDT" | "USDC";

export interface MarketLevel {
  price: number;
  priceScaled: bigint;
  amount: number;
}

export interface MarketBook {
  exchange: string;
  quote: MarketQuote;
  bids: MarketLevel[];
  asks: MarketLevel[];
  at: number;
}

export interface MarketSource {
  exchange: string;
  quote: MarketQuote;
  book: MarketBook | null;
  error: string | null;
  at: number | null;
}

export function level(value: unknown): MarketLevel | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const rawPrice = String(value[0]);
  const price = Number(rawPrice);
  const amount = Number(value[1]);
  const match = rawPrice.match(/^(\d+)(?:\.(\d{1,8}))?$/);
  const priceScaled = match ? BigInt(match[1]! + (match[2] ?? "").padEnd(8, "0")) : null;
  return priceScaled !== null &&
    priceScaled > 0n &&
    Number.isFinite(price) &&
    Number.isFinite(amount) &&
    amount > 0
    ? { price, priceScaled, amount }
    : null;
}

export function levels(value: unknown, descending: boolean): MarketLevel[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(level)
    .filter((v): v is MarketLevel => v !== null)
    .sort((a, b) =>
      descending ? (b.priceScaled > a.priceScaled ? 1 : -1) : a.priceScaled > b.priceScaled ? 1 : -1
    )
    .slice(0, 20);
}

export function parseGateBook(raw: unknown, quote: MarketQuote, at: number): MarketBook {
  const r = raw as { bids?: unknown; asks?: unknown };
  return { exchange: "Gate", quote, bids: levels(r?.bids, true), asks: levels(r?.asks, false), at };
}

export function parseOkxBook(raw: unknown, quote: MarketQuote, at: number): MarketBook {
  const data = (raw as { data?: Array<{ bids?: unknown; asks?: unknown }> })?.data?.[0];
  return {
    exchange: "OKX",
    quote,
    bids: levels(data?.bids, true),
    asks: levels(data?.asks, false),
    at,
  };
}

export function parseHtxBook(raw: unknown, quote: MarketQuote, at: number): MarketBook {
  const tick = (raw as { tick?: { bids?: unknown; asks?: unknown } })?.tick;
  return {
    exchange: "HTX",
    quote,
    bids: levels(tick?.bids, true),
    asks: levels(tick?.asks, false),
    at,
  };
}

export function bestBid(book: MarketBook | null): MarketLevel | null {
  return book?.bids[0] ?? null;
}

export function bestAsk(book: MarketBook | null): MarketLevel | null {
  return book?.asks[0] ?? null;
}

export function spread(book: MarketBook | null): { absolute: number; percent: number } | null {
  const bid = bestBid(book);
  const ask = bestAsk(book);
  if (!bid || !ask) return null;
  const absolute = Number(ask.priceScaled - bid.priceScaled) / 100_000_000;
  const mid = (ask.priceScaled + bid.priceScaled) / 2n;
  return { absolute, percent: (Number(ask.priceScaled - bid.priceScaled) / Number(mid)) * 100 };
}

export function crossExchange(book: MarketBook[]): {
  bid: MarketLevel | null;
  ask: MarketLevel | null;
} {
  const bids = book.flatMap((b) => b.bids.slice(0, 1));
  const asks = book.flatMap((b) => b.asks.slice(0, 1));
  return {
    bid: bids.sort((a, b) => (b.priceScaled > a.priceScaled ? 1 : -1))[0] ?? null,
    ask: asks.sort((a, b) => (a.priceScaled > b.priceScaled ? 1 : -1))[0] ?? null,
  };
}

export function formatPrice(value: number | null): string {
  return value === null || !Number.isFinite(value) ? "—" : value.toFixed(value < 10 ? 4 : 2);
}

export function difference(a: MarketLevel | null, b: MarketLevel | null): number | null {
  return a && b ? Number(a.priceScaled - b.priceScaled) / 100_000_000 : null;
}
