"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { formatPpmPercent, formatPrice, formatScaled } from "@/shared/lib/market/decimal";
import { DEX_QUOTE_ASSETS, DEX_QUOTE_ORDER, type DexQuoteAsset } from "@/shared/lib/market/dexie";
import { stickyWindow, type DepthWindow } from "@/shared/lib/market/depth";
import {
  compare,
  crossExchange,
  EXCHANGES,
  midPrice,
  spread,
  spreadOf,
  type MarketLevel,
  type MarketQuote,
} from "@/shared/lib/market/orderbook";
import { takerShare, tradeKey } from "@/shared/lib/market/trades";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, StatTile } from "@/shared/ui";
import { intlTag } from "@/shared/i18n/active";
import { formatFixed } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
import { routes } from "@/shared/lib/routes";
import { Battlefield, DashSwatch, TakerBar } from "./Battlefield";
import { isLive, useDexBook, useMarketBooks, type SourceState } from "./useMarketData";

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void): () => void {
  const query = window.matchMedia(REDUCED_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** The system's prefers-reduced-motion, live. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false
  );
}

function time(at: number | null): string {
  return at ? new Date(at).toLocaleTimeString(intlTag()) : "—";
}

function Price({ value, quote }: { value: bigint | null | undefined; quote: string }) {
  return (
    <span className="tabular">
      {formatPrice(value)} {quote}
    </span>
  );
}

function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  render?: (v: T) => string;
}) {
  return (
    <div
      className="flex flex-wrap rounded-sm border border-border p-0.5"
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={`px-3 py-1.5 text-xs font-semibold ${value === option ? "bg-primary-soft text-primary" : "text-fg-muted hover:text-fg"}`}
        >
          {render ? render(option) : option}
        </button>
      ))}
    </div>
  );
}

function Depth({ bids, asks }: { bids: MarketLevel[]; asks: MarketLevel[] }) {
  const t = useT("market");
  const rows = Math.min(8, Math.max(bids.length, asks.length));
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
              <span className="tabular">{l ? formatFixed(l.amount, 3) : "—"}</span>
              <span className="tabular text-primary">{formatPrice(l?.priceScaled)}</span>
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
              <span className="tabular text-danger">{formatPrice(l?.priceScaled)}</span>
              <span className="tabular">{l ? formatFixed(l.amount, 3) : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ExchangeCard({ source, quote }: { source: SourceState; quote: MarketQuote }) {
  const t = useT("market");
  const book = source.book;
  const live = isLive(source);
  const s = spread(book);
  return (
    <Card data-testid={`market-source-${source.exchange}`} data-state={live ? "live" : "stale"}>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <DashSwatch exchange={source.exchange} stale={!live} />
            {source.exchange}
            <Badge tone={live ? "primary" : book ? "warning" : "danger"}>
              {live ? t("live") : t("stale")}
            </Badge>
          </span>
        }
        action={
          <span className="text-right text-[11px] text-fg-faint">
            {source.at ? t("lastUpdate", { time: time(source.at) }) : t("notYet")}
          </span>
        }
      />
      <CardBody>
        {source.error ? (
          <p
            className="mb-3 rounded-sm border border-warning/40 bg-surface-2 px-2 py-1.5 text-xs text-fg-muted"
            role="status"
          >
            {t("staleNote", {
              reason: source.error,
              retry: source.retryAt ? time(source.retryAt) : "—",
            })}
          </p>
        ) : null}
        {book ? (
          <div className={live ? undefined : "opacity-55 grayscale"}>
            <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-fg-faint">{t("bid")}</dt>
                <dd className="text-primary">
                  <Price value={book.bids[0]?.priceScaled} quote={quote} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-faint">{t("ask")}</dt>
                <dd className="text-danger">
                  <Price value={book.asks[0]?.priceScaled} quote={quote} />
                </dd>
              </div>
              <div>
                <dt className="text-fg-faint">{t("spread")}</dt>
                <dd className="tabular">{s ? `${formatScaled(s.absolute, 4)} ${quote}` : "—"}</dd>
              </div>
              <div>
                <dt className="text-fg-faint">{t("spreadPercent")}</dt>
                <dd className="tabular">{formatPpmPercent(s?.ppm, 3)}</dd>
              </div>
            </dl>
            <Depth bids={book.bids} asks={book.asks} />
          </div>
        ) : (
          <EmptyState
            title={source.error ? t("sourceUnavailable") : t("loadingBook")}
            description={source.error ? t("sourceExcluded") : undefined}
          />
        )}
      </CardBody>
    </Card>
  );
}

export function MarketPage() {
  const t = useT("market");
  const [quote, setQuote] = useState<MarketQuote>("USDT");
  const [dexAsset, setDexAsset] = useState<DexQuoteAsset>("BYC");
  const systemReduced = usePrefersReducedMotion();
  const [motion, setMotion] = useState<boolean | null>(null);
  const reduced = motion === null ? systemReduced : !motion;
  const data = useMarketBooks(quote);
  const dex = useDexBook(dexAsset);

  const listed = data.sources.filter((s) => s.listed);
  const unlisted = data.sources.filter((s) => !s.listed);
  const liveBooks = useMemo(
    () => data.sources.flatMap((s) => (isLive(s) ? [s.book] : [])),
    [data.sources]
  );
  const staleBooks = useMemo(
    () => data.sources.flatMap((s) => (s.listed && s.book && !isLive(s) ? [s.book] : [])),
    [data.sources]
  );
  const cross = useMemo(() => crossExchange(liveBooks), [liveBooks]);
  const crossSpread = spreadOf(cross.bid?.priceScaled, cross.ask?.priceScaled);
  const crossed = crossSpread !== null && crossSpread.absolute < 0n;
  const cexMid = midPrice(cross.bid?.priceScaled, cross.ask?.priceScaled);

  const bidPrice = cross.bid?.priceScaled ?? null;
  const askPrice = cross.ask?.priceScaled ?? null;
  const [range, setRange] = useState<DepthWindow | null>(null);
  useEffect(() => {
    setRange((previous) => stickyWindow(previous, bidPrice, askPrice) ?? previous);
  }, [bidPrice, askPrice]);
  useEffect(() => setRange(null), [quote]);

  const hourAgo = data.updatedAt ? data.updatedAt - 3_600_000 : 0;
  const share = takerShare(data.tape, hourAgo);

  const dexBid = dex.bids[0]?.priceScaled ?? null;
  const dexAsk = dex.asks[0]?.priceScaled ?? null;
  const dexMid = midPrice(dexBid, dexAsk);
  const dexSpread = spreadOf(dexBid, dexAsk);
  const dexVsCex = compare(dexMid, cexMid);
  const assetInfo = DEX_QUOTE_ASSETS[dexAsset];
  const likeForLike = assetInfo.wraps === quote;
  const dexStale = dex.error !== null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">{t("intro")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Toggle
            label={t("quoteCurrency")}
            options={["USDT", "USDC"] as const}
            value={quote}
            onChange={setQuote}
          />
          <Button size="sm" onClick={() => setMotion(reduced)} aria-pressed={reduced}>
            {t("reduceMotion")}
          </Button>
        </div>
      </header>

      <p
        className="rounded-card border border-warning/40 bg-surface px-4 py-3 text-xs text-fg-muted"
        data-testid="market-disclaimer"
      >
        {t.rich("disclaimer", {
          link: (c) => (
            <Link href={routes.legalTerms()} className="text-accent hover:underline">
              {c}
            </Link>
          ),
        })}
      </p>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <StatTile
          label={t("bestBid")}
          value={<Price value={cross.bid?.priceScaled} quote={quote} />}
          sub={cross.bid ? t("onExchange", { exchange: cross.bid.exchange }) : t("noLiveBooks")}
          tone="primary"
        />
        <StatTile
          label={t("bestAsk")}
          value={<Price value={cross.ask?.priceScaled} quote={quote} />}
          sub={cross.ask ? t("onExchange", { exchange: cross.ask.exchange }) : t("noLiveBooks")}
          tone="danger"
        />
        <StatTile
          label={t("crossSpread")}
          value={crossSpread ? `${formatScaled(crossSpread.absolute, 4, 8, true)} ${quote}` : "—"}
          sub={
            crossSpread
              ? `${formatPpmPercent(crossSpread.ppm, 3)} · ${crossed ? t("crossedBooks") : t("bidToAsk")}`
              : t("bidToAsk")
          }
          tone={crossed ? "warning" : "default"}
        />
        <StatTile
          label={t("midPrice")}
          value={<Price value={cexMid} quote={quote} />}
          sub={t("midSub")}
        />
        <StatTile
          label={t("sources")}
          value={`${liveBooks.length}/${listed.length}`}
          sub={data.updatedAt ? t("updated", { time: time(data.updatedAt) }) : t("waiting")}
          tone={liveBooks.length < listed.length ? "warning" : "default"}
        />
      </div>

      {unlisted.length > 0 ? (
        <p className="text-xs text-fg-muted" data-testid="market-unlisted">
          {t("unlistedNote", {
            quote,
            exchanges: unlisted.map((s) => s.exchange).join(", "),
            listed: listed.map((s) => s.exchange).join(", "),
          })}
        </p>
      ) : null}

      <Card>
        <CardHeader
          title={t("battlefield")}
          action={
            <span className="text-[11px] text-fg-faint">
              {reduced ? t("staticChart") : t("liveChart")}
            </span>
          }
        />
        <CardBody className="space-y-4">
          <p className="text-xs text-fg-faint">{t("battlefieldIntro")}</p>
          {range && liveBooks.length + staleBooks.length > 0 ? (
            <Battlefield
              live={liveBooks}
              stale={staleBooks}
              range={range}
              cross={cross}
              quote={quote}
              batch={data.batch}
              tape={data.tape}
              reduced={reduced}
            />
          ) : (
            <EmptyState title={data.updatedAt ? t("noLiveBooks") : t("loadingBooks")} />
          )}
          <ul
            className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted"
            aria-label={t("legend")}
          >
            {listed.map((s) => (
              <li key={s.exchange} className="flex items-center gap-1.5">
                <DashSwatch exchange={s.exchange} stale={!isLive(s)} />
                {s.exchange}
                {!isLive(s) ? <span className="text-fg-faint">({t("stale")})</span> : null}
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/60"
                aria-hidden="true"
              />
              {t("legendBids")}
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm bg-danger/60"
                aria-hidden="true"
              />
              {t("legendAsks")}
            </li>
            <li>{t("legendHits")}</li>
          </ul>
          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
                {t("takerTitle")}
              </h3>
              <TakerBar buy={share.buy} sell={share.sell} />
              <p className="mt-2 text-[11px] text-fg-faint">{t("takerNote")}</p>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-fg-muted">
                {t("fills")}
              </h3>
              {data.tape.length ? (
                <ol
                  className="max-h-56 overflow-y-auto text-xs"
                  data-testid="market-tape"
                  tabIndex={0}
                  aria-label={t("fills")}
                >
                  {data.tape.slice(0, 15).map((trade) => (
                    <li
                      key={tradeKey(trade)}
                      className="animate-row-in grid grid-cols-[5.5rem_3rem_1fr_1fr] gap-2 border-b border-border/50 py-1 pl-2"
                    >
                      <span className="tabular text-fg-faint">{time(trade.at)}</span>
                      <span className="text-fg-muted">{trade.exchange}</span>
                      <span className={trade.side === "buy" ? "text-primary" : "text-danger"}>
                        {trade.side === "buy" ? t("takerBuy") : t("takerSell")}
                      </span>
                      <span className="tabular text-right text-fg-muted">
                        {formatFixed(trade.amount, 3)} @ {formatPrice(trade.priceScaled)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-fg-faint">{t("noFills")}</p>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      <section aria-labelledby="market-cex">
        <div className="mb-3">
          <h2 id="market-cex" className="text-sm font-semibold">
            {t("cexBooks")}
          </h2>
          <p className="mt-1 text-xs text-fg-faint">{t("cexIntro")}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {listed.map((source) => (
            <ExchangeCard key={source.exchange} source={source} quote={quote} />
          ))}
        </div>
      </section>

      <Card data-testid="market-dex">
        <CardHeader
          title={t("dexTitle", { asset: dexAsset })}
          action={
            <a
              className="text-[11px] text-accent hover:underline"
              href={assetInfo.pairUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t("dexiePair")}
            </a>
          }
        />
        <CardBody className="space-y-3">
          <Toggle
            label={t("dexieQuoteAsset")}
            options={DEX_QUOTE_ORDER}
            value={dexAsset}
            onChange={setDexAsset}
            render={(a) => DEX_QUOTE_ASSETS[a].label}
          />
          <div className={`grid grid-cols-2 gap-2 md:grid-cols-4 ${dexStale ? "opacity-60" : ""}`}>
            <StatTile
              label={t("dexBid")}
              value={<Price value={dexBid} quote={dexAsset} />}
              tone="primary"
            />
            <StatTile
              label={t("dexAsk")}
              value={<Price value={dexAsk} quote={dexAsset} />}
              tone="danger"
            />
            <StatTile
              label={t("dexSpread")}
              value={dexSpread ? `${formatScaled(dexSpread.absolute, 4)} ${dexAsset}` : "—"}
              sub={formatPpmPercent(dexSpread?.ppm, 2)}
            />
            <StatTile
              label={t("dexStatus")}
              value={dexStale ? t("stale") : dex.at ? t("live") : "…"}
              sub={
                dexStale
                  ? t("dexStaleSub", { time: time(dex.at), reason: dex.error ?? "" })
                  : t("dexStatusSub", { time: time(dex.at) })
              }
              tone={dexStale ? "warning" : "default"}
            />
          </div>
          <div
            className="rounded-card border border-border bg-surface-2 px-4 py-3"
            data-testid="market-dex-cex"
          >
            <div className="text-[11px] font-medium uppercase tracking-wider text-fg-muted">
              {t("dexCexSpread", { asset: dexAsset, quote })}
            </div>
            <div className="tabular mt-1 text-2xl font-semibold">
              {dexVsCex ? `${formatScaled(dexVsCex.absolute, 4, 8, true)} ${quote}` : "—"}
            </div>
            <div className="tabular text-sm text-fg-muted">
              {dexVsCex
                ? t("dexCexPercent", {
                    percent: formatPpmPercent(dexVsCex.ppm, 2, true),
                    dex: formatPrice(dexMid),
                    cex: formatPrice(cexMid),
                  })
                : t("waitingBoth")}
            </div>
            <p className="mt-2 text-xs text-fg-faint">
              {likeForLike
                ? t("likeForLike", { asset: dexAsset, quote })
                : t("pegAssumption", { asset: dexAsset, quote })}
            </p>
          </div>
          <p className="text-xs text-fg-faint">
            {t.rich("catNote", {
              label: assetInfo.label,
              description: t(`assetDescriptions.${assetInfo.description}`),
              link: (c) => (
                <Link href={routes.cat(assetInfo.assetId)} className="text-accent hover:underline">
                  {c}
                </Link>
              ),
              id: `${assetInfo.assetId.slice(0, 10)}…${assetInfo.assetId.slice(-6)}`,
            })}
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("howToRead")} />
        <CardBody className="space-y-2 text-sm text-fg-muted">
          <p>{t("howToReadBody")}</p>
          <p>{t("sourcesBody", { exchanges: EXCHANGES.join(", ") })}</p>
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
