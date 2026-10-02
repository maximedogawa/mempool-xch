"use client";

import { useEffect, useRef, useState } from "react";
import {
  canPoll,
  HEALTHY,
  HttpError,
  parseRetryAfter,
  recordFailure,
  recordSuccess,
  type SourceHealth,
} from "@/shared/lib/market/backoff";
import { dexieOffersUrl, parseDexieOffers, type DexQuoteAsset } from "@/shared/lib/market/dexie";
import {
  apiError,
  EXCHANGES,
  lists,
  parseBook,
  type Exchange,
  type MarketBook,
  type MarketLevel,
  type MarketQuote,
} from "@/shared/lib/market/orderbook";
import { mergeTape, parseTrades, type MarketTrade } from "@/shared/lib/market/trades";

/** Books and trades per exchange: 2 requests per exchange every 5 s from a visible tab. */
export const BOOK_REFRESH_MS = 5_000;
/** Dexie offers: 2 requests every 30 s; the DEX moves at block speed. */
export const DEX_REFRESH_MS = 30_000;
const TRADES_LIMIT = 30;

function bookUrl(exchange: Exchange, quote: MarketQuote): string {
  if (exchange === "Gate")
    return `https://api.gateio.ws/api/v4/spot/order_book?currency_pair=XCH_${quote}&limit=50`;
  if (exchange === "OKX")
    return `https://www.okx.com/api/v5/market/books?instId=XCH-${quote}&sz=50`;
  // Without a `depth` parameter HTX returns 150 levels, enough for the ±2 % window.
  return `https://api.huobi.pro/market/depth?symbol=xch${quote.toLowerCase()}&type=step0`;
}

function tradesUrl(exchange: Exchange, quote: MarketQuote): string {
  if (exchange === "Gate")
    return `https://api.gateio.ws/api/v4/spot/trades?currency_pair=XCH_${quote}&limit=${TRADES_LIMIT}`;
  if (exchange === "OKX")
    return `https://www.okx.com/api/v5/market/trades?instId=XCH-${quote}&limit=${TRADES_LIMIT}`;
  return `https://api.huobi.pro/market/history/trade?symbol=xch${quote.toLowerCase()}&size=${TRADES_LIMIT}`;
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new HttpError(
      response.status,
      parseRetryAfter(response.headers.get("retry-after"), Date.now())
    );
  const json: unknown = await response.json();
  const error = apiError(json);
  if (error) throw new Error(error);
  return json;
}

function reason(error: unknown): string {
  return error instanceof Error && error.message ? error.message : "error";
}

function hidden(): boolean {
  return document.visibilityState === "hidden";
}

/** A failed trades request only counts against the exchange when it is a rate limit or outage. */
function throttled(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 429 || error.status >= 500);
}

export interface SourceState {
  exchange: Exchange;
  /** Whether the exchange lists XCH against the selected quote at all. */
  listed: boolean;
  /** The last good book; kept when a later poll fails. */
  book: MarketBook | null;
  /** When `book` was fetched. */
  at: number | null;
  /** Why the last poll failed; set means the kept book is stale and out of the aggregate. */
  error: string | null;
  /** When the source is polled again after a failure. */
  retryAt: number | null;
}

export function isLive(source: SourceState): source is SourceState & { book: MarketBook } {
  return source.listed && source.book !== null && source.error === null;
}

export interface TradeBatch {
  id: number;
  trades: MarketTrade[];
}

export interface MarketBooks {
  quote: MarketQuote;
  sources: SourceState[];
  /** Recent fills over all exchanges, newest first, capped. */
  tape: MarketTrade[];
  /** Fills that arrived with the latest poll (never the first poll of an exchange). */
  batch: TradeBatch | null;
  updatedAt: number | null;
}

function initialBooks(quote: MarketQuote): MarketBooks {
  return {
    quote,
    sources: EXCHANGES.map((exchange) => ({
      exchange,
      listed: lists(exchange, quote),
      book: null,
      at: null,
      error: null,
      retryAt: null,
    })),
    tape: [],
    batch: null,
    updatedAt: null,
  };
}

/**
 * Run `poll` now and every `interval` ms while the tab is visible. Hiding the tab stops the timer
 * and aborts the request in flight; showing it again polls at once. A new `key` restarts it.
 */
function useVisiblePolling(
  poll: (signal: AbortSignal) => Promise<void>,
  interval: number,
  key: string
): void {
  const pollRef = useRef(poll);
  useEffect(() => {
    pollRef.current = poll;
  });
  useEffect(() => {
    let timer: number | undefined;
    let controller: AbortController | null = null;
    let running = false;
    const run = async () => {
      window.clearTimeout(timer);
      if (hidden() || running) return;
      running = true;
      const current = new AbortController();
      controller = current;
      try {
        await pollRef.current(current.signal);
      } catch {
        // Each poll records its own failures; nothing may escape into an unhandled rejection.
      } finally {
        running = false;
      }
      if (!current.signal.aborted && !hidden())
        timer = window.setTimeout(() => void run(), interval);
    };
    const onVisibility = () => {
      if (hidden()) {
        window.clearTimeout(timer);
        controller?.abort();
      } else {
        void run();
      }
    };
    void run();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [interval, key]);
}

/** Public CEX order books and trades for XCH against `quote`, browser-direct. */
export function useMarketBooks(quote: MarketQuote): MarketBooks {
  const [state, setState] = useState<MarketBooks>(() => initialBooks(quote));
  // Polling bookkeeping, owned by the poll loop (never touched during render).
  const loop = useRef({
    quote,
    books: initialBooks(quote),
    health: new Map<Exchange, SourceHealth>(),
    seeded: new Set<Exchange>(),
    batchId: 0,
  });

  useVisiblePolling(
    async (signal) => {
      const l = loop.current;
      if (l.quote !== quote) {
        loop.current = {
          quote,
          books: initialBooks(quote),
          health: new Map(),
          seeded: new Set(),
          batchId: l.batchId,
        };
      }
      const s = loop.current;
      const now = Date.now();
      const due = EXCHANGES.filter(
        (e) => lists(e, quote) && canPoll(s.health.get(e) ?? HEALTHY, now)
      );
      if (due.length === 0) return;
      const results = await Promise.all(
        due.map(async (exchange) => {
          const [book, trades] = await Promise.allSettled([
            getJson(bookUrl(exchange, quote), signal).then((raw) =>
              parseBook(exchange, raw, quote, Date.now())
            ),
            getJson(tradesUrl(exchange, quote), signal).then((raw) =>
              parseTrades(exchange, raw, quote)
            ),
          ]);
          return { exchange, book, trades };
        })
      );
      if (signal.aborted || loop.current !== s) return;
      const at = Date.now();
      let tape = s.books.tape;
      const incoming: MarketTrade[] = [];
      const sources = s.books.sources.map((source) => {
        const r = results.find((x) => x.exchange === source.exchange);
        if (!r) return source;
        const book =
          r.book.status === "fulfilled" && r.book.value.bids.length && r.book.value.asks.length
            ? r.book.value
            : null;
        const failure =
          r.book.status === "rejected"
            ? r.book.reason
            : !book
              ? new Error("empty book")
              : r.trades.status === "rejected" && throttled(r.trades.reason)
                ? r.trades.reason
                : null;
        const health = failure
          ? recordFailure(s.health.get(source.exchange) ?? HEALTHY, at, failure)
          : recordSuccess();
        s.health.set(source.exchange, health);
        if (r.trades.status === "fulfilled") {
          if (s.seeded.has(source.exchange)) {
            incoming.push(...r.trades.value);
          } else {
            // The first poll of an exchange only fills the tape: its fills are history, not hits.
            tape = mergeTape(tape, r.trades.value).tape;
            s.seeded.add(source.exchange);
          }
        }
        return book
          ? {
              ...source,
              book,
              at: book.at,
              error: null,
              retryAt: failure ? health.retryAt : null,
            }
          : { ...source, error: reason(failure), retryAt: health.retryAt };
      });
      const merged = mergeTape(tape, incoming);
      const batch =
        merged.fresh.length > 0 ? { id: ++s.batchId, trades: merged.fresh } : s.books.batch;
      s.books = { quote, sources, tape: merged.tape, batch, updatedAt: at };
      setState(s.books);
    },
    BOOK_REFRESH_MS,
    quote
  );

  return state.quote === quote ? state : initialBooks(quote);
}

export interface DexBook {
  asset: DexQuoteAsset;
  bids: MarketLevel[];
  asks: MarketLevel[];
  /** When the kept offers were fetched. */
  at: number | null;
  /** Why the last poll failed; set means the kept offers are stale. */
  error: string | null;
}

function initialDex(asset: DexQuoteAsset): DexBook {
  return { asset, bids: [], asks: [], at: null, error: null };
}

/** Best Dexie offers between XCH and a stablecoin CAT, both sides. */
export function useDexBook(asset: DexQuoteAsset): DexBook {
  const [state, setState] = useState<DexBook>(() => initialDex(asset));
  const loop = useRef({ asset, health: HEALTHY, book: initialDex(asset) });

  useVisiblePolling(
    async (signal) => {
      if (loop.current.asset !== asset)
        loop.current = { asset, health: HEALTHY, book: initialDex(asset) };
      const s = loop.current;
      if (!canPoll(s.health, Date.now())) return;
      try {
        const [asks, bids] = await Promise.all([
          getJson(dexieOffersUrl(asset, "asks"), signal),
          getJson(dexieOffersUrl(asset, "bids"), signal),
        ]);
        if (signal.aborted || loop.current !== s) return;
        s.health = recordSuccess();
        s.book = {
          asset,
          asks: parseDexieOffers(asks, asset, "asks"),
          bids: parseDexieOffers(bids, asset, "bids"),
          at: Date.now(),
          error: null,
        };
      } catch (error) {
        if (signal.aborted || loop.current !== s) return;
        s.health = recordFailure(s.health, Date.now(), error);
        s.book = { ...s.book, error: reason(error) };
      }
      setState(s.book);
    },
    DEX_REFRESH_MS,
    asset
  );

  return state.asset === asset ? state : initialDex(asset);
}
