"use client";

import { useMemo, useState } from "react";
import {
  formatPrice,
  bestAsk,
  bestBid,
  crossExchange,
  difference,
  spread,
  type MarketQuote,
} from "@/shared/lib/market/orderbook";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, StatTile } from "@/shared/ui";
import { DEX_QUOTE_ASSETS, type DexQuoteAsset, useMarketData } from "./useMarketData";

function Price({ value, quote }: { value: number | null; quote: string }) {
  return (
    <span className="tabular">
      {formatPrice(value)} {quote}
    </span>
  );
}

function Depth({
  bids,
  asks,
}: {
  bids: { price: number; amount: number }[];
  asks: { price: number; amount: number }[];
}) {
  const rows = Math.max(bids.length, asks.length);
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-primary">
          <span>Bids</span>
          <span>Amount · Price</span>
        </div>
        {Array.from({ length: rows }, (_, i) => {
          const l = bids[i];
          return (
            <div
              key={`b${i}`}
              className="flex justify-between border-b border-border/50 py-1 text-fg-muted"
            >
              <span>{l ? l.amount.toFixed(3) : "—"}</span>
              <span className="text-primary">{l ? l.price.toFixed(4) : "—"}</span>
            </div>
          );
        })}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-danger">
          <span>Asks</span>
          <span>Price · Amount</span>
        </div>
        {Array.from({ length: rows }, (_, i) => {
          const l = asks[i];
          return (
            <div
              key={`a${i}`}
              className="flex justify-between border-b border-border/50 py-1 text-fg-muted"
            >
              <span className="text-danger">{l ? l.price.toFixed(4) : "—"}</span>
              <span>{l ? l.amount.toFixed(3) : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketPage() {
  const [quote, setQuote] = useState<MarketQuote>("USDT");
  const [dexAsset, setDexAsset] = useState<DexQuoteAsset>("BYC");
  const [reduced, setReduced] = useState(false);
  const data = useMarketData(quote, dexAsset);
  const books = useMemo(
    () => data.sources.flatMap((s) => (s.book ? [s.book] : [])),
    [data.sources]
  );
  const cross = crossExchange(books);
  const live = data.sources.filter((s) => s.book).length;
  const cexMid = cross.bid && cross.ask ? (cross.bid.price + cross.ask.price) / 2 : null;
  const dexMid =
    data.dex.bid !== null && data.dex.ask !== null ? (data.dex.bid + data.dex.ask) / 2 : null;
  const dexSpread =
    quote === "USDC" && dexAsset === "wUSDC.b" && cexMid !== null && dexMid !== null
      ? { absolute: dexMid - cexMid, percent: ((dexMid - cexMid) / cexMid) * 100 }
      : null;
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Market</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            A live battlefield for XCH liquidity across public order books and Dexie offers. Market
            data is informational only, not financial advice.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-sm border border-border p-0.5"
            role="group"
            aria-label="Quote currency"
          >
            {(["USDT", "USDC"] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuote(q)}
                className={`px-3 py-1.5 text-xs font-semibold ${quote === q ? "bg-primary-soft text-primary" : "text-fg-muted"}`}
              >
                {q}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => setReduced((v) => !v)}>
            {reduced ? "Animate" : "Reduce motion"}
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile
          label="Best bid"
          value={<Price value={cross.bid?.price ?? null} quote={quote} />}
          sub={live ? `${live}/3 exchanges live` : "No live books"}
          tone="primary"
        />
        <StatTile
          label="Best ask"
          value={<Price value={cross.ask?.price ?? null} quote={quote} />}
        />
        <StatTile
          label="Cross spread"
          value={`${formatPrice(difference(cross.ask, cross.bid))} ${quote}`}
          sub="best bid to best ask"
        />
        <StatTile
          label="Sources"
          value={`${live}/3`}
          sub={
            data.updatedAt ? `updated ${new Date(data.updatedAt).toLocaleTimeString()}` : "waiting"
          }
        />
      </div>
      <section aria-label="CEX order books">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">CEX order books</h2>
            <p className="mt-1 text-xs text-fg-faint">
              Gate, OKX and HTX public XCH books.
            </p>
          </div>
        </div>
        <div className={`grid grid-cols-1 gap-4 lg:grid-cols-3 ${reduced ? "" : "market-live"}`}>
          {data.sources.map((source) => {
          const book = source.book;
          const s = spread(book);
          return (
            <Card
              key={`${source.exchange}-${source.at ?? "stale"}`}
              className={book && !reduced ? "market-book" : undefined}
            >
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    {source.exchange}
                    <Badge tone={book ? "primary" : "danger"}>{book ? "LIVE" : "STALE"}</Badge>
                  </span>
                }
                action={
                  <span className="text-[11px] text-fg-faint">
                    {source.at
                      ? new Date(source.at).toLocaleTimeString()
                      : (source.error ?? "not available")}
                  </span>
                }
              />
              <CardBody>
                {book ? (
                  <>
                    <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-fg-faint">Bid</div>
                        <Price value={bestBid(book)?.price ?? null} quote={quote} />
                      </div>
                      <div>
                        <div className="text-fg-faint">Ask</div>
                        <Price value={bestAsk(book)?.price ?? null} quote={quote} />
                      </div>
                      <div>
                        <div className="text-fg-faint">Spread</div>
                        <span className="tabular">{s ? `${s.percent.toFixed(2)}%` : "—"}</span>
                      </div>
                    </div>
                    <Depth bids={book.bids} asks={book.asks} />
                  </>
                ) : (
                  <EmptyState
                    title="Source unavailable"
                    description="It is excluded from the aggregate until a fresh book arrives."
                  />
                )}
              </CardBody>
            </Card>
            );
          })}
        </div>
      </section>
      <div className="flex justify-end">
        <div
          className="flex rounded-sm border border-border p-0.5"
          role="group"
          aria-label="Dexie quote asset"
        >
          {(Object.keys(DEX_QUOTE_ASSETS) as DexQuoteAsset[]).map((asset) => (
            <button
              key={asset}
              type="button"
              onClick={() => setDexAsset(asset)}
              aria-pressed={dexAsset === asset}
              className={`px-3 py-1.5 text-xs font-semibold ${dexAsset === asset ? "bg-primary-soft text-primary" : "text-fg-muted"}`}
            >
              {DEX_QUOTE_ASSETS[asset].label}
            </button>
          ))}
        </div>
      </div>
      <Card>
        <CardHeader
          title={`Dexie DEX · XCH / ${dexAsset}`}
          action={
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-fg-faint">
                {DEX_QUOTE_ASSETS[dexAsset].description}
              </span>
              <a
                className="text-[11px] text-accent hover:underline"
                href={DEX_QUOTE_ASSETS[dexAsset].pairUrl}
                target="_blank"
                rel="noreferrer"
              >
                Dexie pair
              </a>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatTile label="DEX bid" value={<Price value={data.dex.bid} quote={dexAsset} />} />
            <StatTile label="DEX ask" value={<Price value={data.dex.ask} quote={dexAsset} />} />
            <StatTile
              label="DEX status"
              value={data.dex.error ? "STALE" : data.dex.at ? "LIVE" : "…"}
              sub={data.dex.error ?? "Open offers, best price"}
              tone={data.dex.error ? "danger" : "default"}
            />
            <StatTile label="Source" value="Dexie" sub="Public offers API" />
            <StatTile
              label="DEX / CEX spread"
              value={dexSpread ? `${dexSpread.percent.toFixed(2)}%` : "—"}
              sub={
                dexSpread
                  ? `${formatPrice(dexSpread.absolute)} USDC`
                  : quote === "USDT"
                    ? "Select USDC to compare"
                    : dexAsset === "BYC"
                      ? "Different quote asset; comparison disabled"
                      : "Waiting for both books"
              }
            />
          </div>
          <p className="mt-3 text-xs text-fg-faint">
            Dexie quotes are offers for {DEX_QUOTE_ASSETS[dexAsset].label}. They are not directly
            comparable with {quote} unless both use the same quote asset. CEX books above are {quote}.
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="How to read this" />
        <CardBody className="space-y-2 text-sm text-fg-muted">
          <p>
            Buyers face sellers around the midpoint. Best bid is the highest price buyers currently
            show; best ask is the lowest seller price. A stale source stays visible with its last
            update and never affects the cross-exchange aggregate.
          </p>
          <p>
            Inspired by the battlefield layout on{" "}
            <a
              className="text-accent hover:underline"
              href="https://xchmempool.com/battlefield"
              target="_blank"
              rel="noreferrer"
            >
              XCHMempool Battlefield
            </a>
            ; the implementation and visuals here are original.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
