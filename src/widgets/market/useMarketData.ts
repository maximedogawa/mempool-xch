"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketBook, MarketQuote, MarketSource } from "@/shared/lib/market/orderbook";
import { parseGateBook, parseHtxBook, parseOkxBook } from "@/shared/lib/market/orderbook";
import { plainT } from "@/shared/i18n/plain";

const REFRESH_MS = 10_000;
const DEX_REFRESH_MS = 30_000;

export type DexQuoteAsset = "BYC" | "wUSDC.b";

export const DEX_QUOTE_ASSETS: Record<
  DexQuoteAsset,
  { assetId: string; label: string; description: "byc" | "wusdc"; pairUrl: string }
> = {
  BYC: {
    assetId: "ae1536f56760e471ad85ead45f00d680ff9cca73b8cc3407be778f1c0c606eac",
    label: "ByteCash (BYC)",
    description: "byc",
    pairUrl: "https://dexie.space/offers/XCH/BYC",
  },
  "wUSDC.b": {
    assetId: "fa4a180ac326e67ea289b869e3448256f6af05721f7cf934cb9901baa6b7a99d",
    label: "wUSDC.b",
    description: "wusdc",
    pairUrl: "https://dexie.space/offers/XCH/wUSDC.b",
  },
};

export interface DexQuote {
  bid: number | null;
  ask: number | null;
  at: number | null;
  error: string | null;
}
export interface MarketData {
  sources: MarketSource[];
  dex: DexQuote;
  updatedAt: number | null;
  loading: boolean;
}

const INITIAL: MarketData = {
  sources: ["Gate", "OKX", "HTX"].map((exchange) => ({
    exchange,
    quote: "USDT",
    book: null,
    error: null,
    at: null,
  })),
  dex: { bid: null, ask: null, at: null, error: null },
  updatedAt: null,
  loading: true,
};

function endpoint(exchange: string, quote: MarketQuote): string {
  if (exchange === "Gate")
    return `https://api.gateio.ws/api/v4/spot/order_book?currency_pair=XCH_${quote}&limit=20`;
  if (exchange === "OKX")
    return `https://www.okx.com/api/v5/market/books?instId=XCH-${quote}&sz=20`;
  return `https://api.huobi.pro/market/depth?symbol=xch${quote.toLowerCase()}&type=step0&depth=20`;
}

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function parse(exchange: string, raw: unknown, quote: MarketQuote, at: number): MarketBook {
  if (exchange === "Gate") return parseGateBook(raw, quote, at);
  if (exchange === "OKX") return parseOkxBook(raw, quote, at);
  return parseHtxBook(raw, quote, at);
}

async function fetchDex(signal: AbortSignal, at: number, asset: DexQuoteAsset): Promise<DexQuote> {
  const base = "https://api.dexie.space/v1/offers?status=0&page_size=1&compact=true";
  const assetId = DEX_QUOTE_ASSETS[asset].assetId;
  const [asks, bids] = await Promise.all([
    getJson(`${base}&offered=xch&requested=${assetId}&sort=price`, signal),
    getJson(`${base}&offered=${assetId}&requested=xch&sort=price_desc`, signal),
  ]);
  const amount = (raw: unknown): number | null => {
    const offer = (raw as { offers?: Array<{ price?: number }> })?.offers?.[0];
    const value = Number(offer?.price);
    return Number.isFinite(value) && value > 0 ? value : null;
  };
  return { bid: amount(bids), ask: amount(asks), at, error: null };
}

export function useMarketData(quote: MarketQuote, asset: DexQuoteAsset): MarketData {
  const [data, setData] = useState<MarketData>(() => ({
    ...INITIAL,
    sources: INITIAL.sources.map((s) => ({ ...s, quote })),
  }));
  const dexAt = useRef(0);
  const dexRef = useRef<DexQuote>(INITIAL.dex);
  const requestRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);
  const run = useCallback(
    async (forceDex = false) => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      requestRef.current?.abort();
      const controller = new AbortController();
      const sequence = ++sequenceRef.current;
      requestRef.current = controller;
      const at = Date.now();
      setData((current) => ({
        ...current,
        loading: true,
        sources: current.sources.map((s) => ({ ...s, quote })),
      }));
      const results = await Promise.allSettled(
        ["Gate", "OKX", "HTX"].map(async (exchange) => {
          const book = parse(
            exchange,
            await getJson(endpoint(exchange, quote), controller.signal),
            quote,
            at
          );
          if (book.bids.length === 0 || book.asks.length === 0)
            throw new Error(plainT("market")("emptyBook"));
          return book;
        })
      );
      if (controller.signal.aborted || sequence !== sequenceRef.current) return;
      const sources = results.map((result, index) => {
        const exchange = ["Gate", "OKX", "HTX"][index]!;
        return result.status === "fulfilled"
          ? { exchange, quote, book: result.value, error: null, at }
          : {
              exchange,
              quote,
              book: null,
              error:
                result.reason instanceof Error
                  ? result.reason.message
                  : plainT("market")("unavailable"),
              at: null,
            };
      });
      let dex = dexRef.current;
      if (forceDex || at - dexAt.current >= DEX_REFRESH_MS) {
        dexAt.current = at;
        try {
          dex = await fetchDex(controller.signal, at, asset);
        } catch (error) {
          dex = {
            ...dex,
            error: error instanceof Error ? error.message : plainT("market")("unavailable"),
          };
        }
      }
      dexRef.current = dex;
      if (sequence === sequenceRef.current)
        setData({ sources, dex, updatedAt: at, loading: false });
    },
    [quote, asset]
  );

  useEffect(() => {
    dexAt.current = 0;
    dexRef.current = INITIAL.dex;
    setData((current) => ({ ...current, dex: INITIAL.dex }));
  }, [asset]);

  useEffect(() => {
    void run(true);
    const timer = window.setInterval(() => void run(false), REFRESH_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void run(false);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      requestRef.current?.abort();
      requestRef.current = null;
    };
  }, [run]);
  return data;
}
