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
import { intlTag } from "@/shared/i18n/active";
import { formatFixed } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
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
  const t = useT("market");
  const rows = Math.max(bids.length, asks.length);
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div>
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-primary">
          <span>{t("bids")}</span>
          <span>{t("amountPrice")}</span>
        </div>
        {Array.from({ length: rows }, (_, i) => {
          const l = bids[i];
          return (
            <div
              key={`b${i}`}
              className="flex justify-between border-b border-border/50 py-1 text-fg-muted"
            >
              <span>{l ? formatFixed(l.amount, 3) : "—"}</span>
              <span className="text-primary">{l ? formatFixed(l.price, 4) : "—"}</span>
            </div>
          );
        })}
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-danger">
          <span>{t("asks")}</span>
          <span>{t("priceAmount")}</span>
        </div>
        {Array.from({ length: rows }, (_, i) => {
          const l = asks[i];
          return (
            <div
              key={`a${i}`}
              className="flex justify-between border-b border-border/50 py-1 text-fg-muted"
            >
              <span className="text-danger">{l ? formatFixed(l.price, 4) : "—"}</span>
              <span>{l ? formatFixed(l.amount, 3) : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MarketPage() {
  const t = useT("market");
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
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{t("intro")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-sm border border-border p-0.5"
            role="group"
            aria-label={t("quoteCurrency")}
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
            {reduced ? t("animate") : t("reduceMotion")}
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile
          label={t("bestBid")}
          value={<Price value={cross.bid?.price ?? null} quote={quote} />}
          sub={live ? t("exchangesLive", { live }) : t("noLiveBooks")}
          tone="primary"
        />
        <StatTile
          label={t("bestAsk")}
          value={<Price value={cross.ask?.price ?? null} quote={quote} />}
        />
        <StatTile
          label={t("crossSpread")}
          value={`${formatPrice(difference(cross.ask, cross.bid))} ${quote}`}
          sub={t("bidToAsk")}
        />
        <StatTile
          label={t("sources")}
          value={`${live}/3`}
          sub={
            data.updatedAt
              ? t("updated", { time: new Date(data.updatedAt).toLocaleTimeString(intlTag()) })
              : t("waiting")
          }
        />
      </div>
      <section aria-label={t("cexBooks")}>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">{t("cexBooks")}</h2>
            <p className="mt-1 text-xs text-fg-faint">{t("cexIntro")}</p>
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
                      <Badge tone={book ? "primary" : "danger"}>
                        {book ? t("live") : t("stale")}
                      </Badge>
                    </span>
                  }
                  action={
                    <span className="text-[11px] text-fg-faint">
                      {source.at
                        ? new Date(source.at).toLocaleTimeString(intlTag())
                        : (source.error ?? t("notAvailable"))}
                    </span>
                  }
                />
                <CardBody>
                  {book ? (
                    <>
                      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <div className="text-fg-faint">{t("bid")}</div>
                          <Price value={bestBid(book)?.price ?? null} quote={quote} />
                        </div>
                        <div>
                          <div className="text-fg-faint">{t("ask")}</div>
                          <Price value={bestAsk(book)?.price ?? null} quote={quote} />
                        </div>
                        <div>
                          <div className="text-fg-faint">{t("spread")}</div>
                          <span className="tabular">
                            {s ? `${formatFixed(s.percent, 2)}%` : "—"}
                          </span>
                        </div>
                      </div>
                      <Depth bids={book.bids} asks={book.asks} />
                    </>
                  ) : (
                    <EmptyState title={t("sourceUnavailable")} description={t("sourceExcluded")} />
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
          aria-label={t("dexieQuoteAsset")}
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
                {t(`assetDescriptions.${DEX_QUOTE_ASSETS[dexAsset].description}`)}
              </span>
              <a
                className="text-[11px] text-accent hover:underline"
                href={DEX_QUOTE_ASSETS[dexAsset].pairUrl}
                target="_blank"
                rel="noreferrer"
              >
                {t("dexiePair")}
              </a>
            </div>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatTile label={t("dexBid")} value={<Price value={data.dex.bid} quote={dexAsset} />} />
            <StatTile label={t("dexAsk")} value={<Price value={data.dex.ask} quote={dexAsset} />} />
            <StatTile
              label={t("dexStatus")}
              value={data.dex.error ? t("stale") : data.dex.at ? t("live") : "…"}
              sub={data.dex.error ?? t("dexStatusSub")}
              tone={data.dex.error ? "danger" : "default"}
            />
            <StatTile label={t("source")} value="Dexie" sub={t("publicOffersApi")} />
            <StatTile
              label={t("dexCexSpread")}
              value={dexSpread ? `${formatFixed(dexSpread.percent, 2)}%` : "—"}
              sub={
                dexSpread
                  ? `${formatPrice(dexSpread.absolute)} USDC`
                  : quote === "USDT"
                    ? t("selectUsdc")
                    : dexAsset === "BYC"
                      ? t("differentQuote")
                      : t("waitingBoth")
              }
            />
          </div>
          <p className="mt-3 text-xs text-fg-faint">
            {t("dexNote", { asset: DEX_QUOTE_ASSETS[dexAsset].label, quote })}
          </p>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("howToRead")} />
        <CardBody className="space-y-2 text-sm text-fg-muted">
          <p>{t("howToReadBody")}</p>
          <p>
            {t.rich("inspired", {
              link: (c) => (
                <a
                  className="text-accent hover:underline"
                  href="https://xchmempool.com/battlefield"
                  target="_blank"
                  rel="noreferrer"
                >
                  {c}
                </a>
              ),
            })}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
