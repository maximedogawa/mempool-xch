"use client";

/**
 * The battlefield: cumulative bids (buyers, left) and asks (sellers, right) of every exchange
 * facing each other around the mid, the front line at the best cross-exchange bid and ask, and
 * public fills landing as hits on the side they took. The idea of buyers and sellers as two
 * armies over a landscape of resting orders comes from XCHMempool's Battlefield (credited on the
 * page); drawing, code and styling here are original. Plain SVG, one rAF tween per book update.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice, toNumber } from "@/shared/lib/market/decimal";
import {
  areaPath,
  DEPTH_POINTS,
  depthSeries,
  easeOut,
  gridPrice,
  lerpSeries,
  linePath,
  sumSeries,
  type DepthWindow,
} from "@/shared/lib/market/depth";
import type { CrossBest, Exchange, MarketBook, MarketQuote } from "@/shared/lib/market/orderbook";
import { hitSide, tradeKey, type MarketTrade } from "@/shared/lib/market/trades";
import { formatFixed, formatInteger } from "@/shared/i18n/number";
import { useT } from "@/shared/i18n/useT";
import type { TradeBatch } from "./useMarketData";
import marketNs from "@/shared/i18n/messages/en/market";

/** Line pattern per exchange, so the three books stay apart without extra colours. */
export const EXCHANGE_DASH: Record<Exchange, string | undefined> = {
  Gate: undefined,
  OKX: "7 4",
  HTX: "2 3",
};

interface Series {
  bids: number[];
  asks: number[];
}

interface Frame {
  aggregate: Series;
  books: Record<string, Series>;
}

function frameFor(live: MarketBook[], stale: MarketBook[], range: DepthWindow): Frame {
  const books: Record<string, Series> = {};
  for (const b of [...live, ...stale])
    books[b.exchange] = {
      bids: depthSeries(b.bids, "bids", range),
      asks: depthSeries(b.asks, "asks", range),
    };
  const liveSeries = live.map((b) => books[b.exchange]!);
  return {
    aggregate: {
      bids: sumSeries(liveSeries.map((s) => s.bids)),
      asks: sumSeries(liveSeries.map((s) => s.asks)),
    },
    books,
  };
}

function lerpFrame(from: Frame | null, to: Frame, t: number): Frame {
  if (!from || t >= 1) return to;
  const books: Record<string, Series> = {};
  for (const [k, s] of Object.entries(to.books))
    books[k] = {
      bids: lerpSeries(from.books[k]?.bids, s.bids, t),
      asks: lerpSeries(from.books[k]?.asks, s.asks, t),
    };
  return {
    aggregate: {
      bids: lerpSeries(from.aggregate.bids, to.aggregate.bids, t),
      asks: lerpSeries(from.aggregate.asks, to.aggregate.asks, t),
    },
    books,
  };
}

const TWEEN_MS = 700;
const HIT_MS = 1_500;
const MAX_HITS = 18;

interface Hit {
  key: string;
  trade: MarketTrade;
}

function useWidth(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry?.contentRect.width ?? 0);
      if (w > 0) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

export function Battlefield({
  live,
  stale,
  range,
  cross,
  quote,
  batch,
  tape,
  reduced,
}: {
  live: MarketBook[];
  stale: MarketBook[];
  range: DepthWindow;
  cross: CrossBest;
  quote: MarketQuote;
  batch: TradeBatch | null;
  tape: MarketTrade[];
  reduced: boolean;
}) {
  const t = useT(marketNs);
  const [boxRef, width] = useWidth();
  const height = width < 520 ? 220 : 280;
  const pad = { top: 22, right: 10, bottom: 26, left: 10 };
  const plotW = Math.max(10, width - pad.left - pad.right);
  const plotH = height - pad.top - pad.bottom;
  const baseline = pad.top + plotH;

  const target = useMemo(() => frameFor(live, stale, range), [live, stale, range]);
  const [frame, setFrame] = useState<Frame>(target);
  const shown = useRef<Frame>(target);

  // Tween the landscape towards each new snapshot; snap when motion is reduced or the tab hidden.
  useEffect(() => {
    if (reduced || document.visibilityState === "hidden") {
      shown.current = target;
      setFrame(target);
      return;
    }
    const from = shown.current;
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = easeOut((now - start) / TWEEN_MS);
      const next = lerpFrame(from, target, k);
      shown.current = next;
      setFrame(next);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  // Replay each poll's new fills as hits, spread over the poll interval in the order they traded.
  const [hits, setHits] = useState<Hit[]>([]);
  const timers = useRef(new Set<number>());
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };
  }, []);
  useEffect(() => {
    if (!batch || reduced || document.visibilityState === "hidden") return;
    const trades = batch.trades.slice(-MAX_HITS);
    const spacing = Math.min(450, 4_000 / trades.length);
    trades.forEach((trade, i) => {
      const key = `${batch.id}:${tradeKey(trade)}`;
      const show = window.setTimeout(() => {
        timers.current.delete(show);
        setHits((current) => [...current.slice(-(MAX_HITS - 1)), { key, trade }]);
        const hide = window.setTimeout(() => {
          timers.current.delete(hide);
          setHits((current) => current.filter((h) => h.key !== key));
        }, HIT_MS);
        timers.current.add(hide);
      }, i * spacing);
      timers.current.add(show);
    });
  }, [batch, reduced]);
  useEffect(() => {
    if (reduced) setHits([]);
  }, [reduced]);

  const low = toNumber(range.low);
  const high = toNumber(range.high);
  const xOfPrice = (p: number) => pad.left + ((p - low) / (high - low)) * plotW;
  const xBid = (i: number) => xOfPrice(gridPrice(range, "bids", i));
  const xAsk = (i: number) => xOfPrice(gridPrice(range, "asks", i));
  const peak = Math.max(
    1e-9,
    ...frame.aggregate.bids.filter(Number.isFinite),
    ...frame.aggregate.asks.filter(Number.isFinite),
    ...Object.values(frame.books).flatMap((s) => [...s.bids, ...s.asks].filter(Number.isFinite))
  );
  const yMax = peak * 1.12;
  const y = (v: number) => baseline - (v / yMax) * plotH;
  const midX = xOfPrice(toNumber(range.mid));
  const bidX = cross.bid ? xOfPrice(toNumber(cross.bid.priceScaled)) : null;
  const askX = cross.ask ? xOfPrice(toNumber(cross.ask.priceScaled)) : null;
  const crossed = bidX !== null && askX !== null && bidX > askX;

  const hitPoint = (trade: MarketTrade) => {
    const side = hitSide(trade);
    const price = Math.min(high, Math.max(low, toNumber(trade.priceScaled)));
    const mid = toNumber(range.mid);
    const edge = side === "bids" ? low : high;
    const i = Math.round(((price - mid) / (edge - mid)) * (DEPTH_POINTS - 1));
    const depth = frame.aggregate[side][Math.max(0, Math.min(DEPTH_POINTS - 1, i))];
    return {
      x: xOfPrice(price),
      y: depth !== undefined && Number.isFinite(depth) ? y(depth) : baseline - 12,
      side,
      r: Math.min(16, 4 + Math.sqrt(trade.amount) * 1.2),
    };
  };

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const p = range.low + ((range.high - range.low) * BigInt(Math.round(f * 1000))) / 1000n;
    return { x: pad.left + f * plotW, label: formatPrice(p) };
  });
  const recent = tape.slice(0, 12);
  const summary = t("chartSummary", {
    bid: cross.bid ? `${formatPrice(cross.bid.priceScaled)} ${quote} (${cross.bid.exchange})` : "—",
    ask: cross.ask ? `${formatPrice(cross.ask.priceScaled)} ${quote} (${cross.ask.exchange})` : "—",
    books: live.length,
  });

  return (
    <div ref={boxRef} className="w-full" data-testid="market-battlefield" data-reduced={reduced}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={summary}
        className="block overflow-visible"
      >
        <rect
          x={pad.left}
          y={pad.top}
          width={Math.max(0, midX - pad.left)}
          height={plotH}
          fill="var(--primary)"
          opacity={0.04}
        />
        <rect
          x={midX}
          y={pad.top}
          width={Math.max(0, pad.left + plotW - midX)}
          height={plotH}
          fill="var(--danger)"
          opacity={0.04}
        />
        {bidX !== null && askX !== null ? (
          <rect
            data-testid="market-gap"
            x={Math.min(bidX, askX)}
            y={pad.top}
            width={Math.max(1, Math.abs(askX - bidX))}
            height={plotH}
            fill={crossed ? "var(--warning)" : "var(--fg-faint)"}
            opacity={crossed ? 0.22 : 0.12}
          />
        ) : null}
        <path
          d={areaPath(frame.aggregate.bids, xBid, y, baseline)}
          fill="var(--primary)"
          fillOpacity={0.18}
        />
        <path
          d={areaPath(frame.aggregate.asks, xAsk, y, baseline)}
          fill="var(--danger)"
          fillOpacity={0.18}
        />
        {[...live, ...stale].map((b) => {
          const s = frame.books[b.exchange];
          if (!s) return null;
          const isStale = !live.includes(b);
          return (
            <g
              key={b.exchange}
              opacity={isStale ? 0.45 : 1}
              data-testid={`market-line-${b.exchange}`}
              data-stale={isStale}
            >
              <path
                d={linePath(s.bids, xBid, y)}
                fill="none"
                stroke={isStale ? "var(--fg-faint)" : "var(--primary)"}
                strokeWidth={1.6}
                strokeDasharray={EXCHANGE_DASH[b.exchange]}
              />
              <path
                d={linePath(s.asks, xAsk, y)}
                fill="none"
                stroke={isStale ? "var(--fg-faint)" : "var(--danger)"}
                strokeWidth={1.6}
                strokeDasharray={EXCHANGE_DASH[b.exchange]}
              />
            </g>
          );
        })}
        <line
          x1={midX}
          x2={midX}
          y1={pad.top - 6}
          y2={baseline}
          stroke="var(--fg-muted)"
          strokeDasharray="3 3"
        />
        <text
          x={midX}
          y={pad.top - 9}
          textAnchor="middle"
          fontSize={11}
          fill="var(--fg-muted)"
          className="tabular"
        >
          {t("midLabel", { price: formatPrice(range.mid) })}
        </text>
        {bidX !== null ? (
          <line
            x1={bidX}
            x2={bidX}
            y1={pad.top}
            y2={baseline}
            stroke="var(--primary)"
            strokeWidth={2}
          />
        ) : null}
        {askX !== null ? (
          <line
            x1={askX}
            x2={askX}
            y1={pad.top}
            y2={baseline}
            stroke="var(--danger)"
            strokeWidth={2}
          />
        ) : null}
        <text x={pad.left + 2} y={pad.top + 11} fontSize={11} fill="var(--fg-faint)">
          {t("depthMax", { amount: formatInteger(Math.round(yMax)) })}
        </text>
        {recent.map((trade) => {
          const p = hitPoint(trade);
          return (
            <path
              key={`tick-${tradeKey(trade)}`}
              d={`M${p.x.toFixed(1)},${baseline}l-3,6h6z`}
              fill={p.side === "bids" ? "var(--primary)" : "var(--danger)"}
              opacity={0.7}
            />
          );
        })}
        {hits.map(({ key, trade }) => {
          const p = hitPoint(trade);
          return (
            <g key={key} data-testid="market-hit" data-side={p.side}>
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r}
                className="market-hit"
                fill={p.side === "bids" ? "var(--primary)" : "var(--danger)"}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={p.r}
                className="market-hit-ring"
                fill="none"
                stroke={p.side === "bids" ? "var(--primary)" : "var(--danger)"}
                strokeWidth={1.5}
              />
            </g>
          );
        })}
        <line
          x1={pad.left}
          x2={pad.left + plotW}
          y1={baseline}
          y2={baseline}
          stroke="var(--border-strong)"
        />
        {ticks.map((tick, i) => (
          <text
            key={i}
            x={tick.x}
            y={height - 6}
            textAnchor={i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle"}
            fontSize={11}
            fill="var(--fg-faint)"
            className="tabular"
          >
            {tick.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/** Small legend swatch drawing an exchange's line pattern. */
export function DashSwatch({ exchange, stale }: { exchange: Exchange; stale?: boolean }) {
  return (
    <svg width="22" height="8" aria-hidden="true" className="shrink-0">
      <line
        x1="1"
        x2="21"
        y1="4"
        y2="4"
        stroke={stale ? "var(--fg-faint)" : "var(--fg-muted)"}
        strokeWidth="2"
        strokeDasharray={EXCHANGE_DASH[exchange]}
      />
    </svg>
  );
}

/** Taker buy vs sell volume bar: who has been hitting whom. */
export function TakerBar({ buy, sell }: { buy: number; sell: number }) {
  const t = useT(marketNs);
  const total = buy + sell;
  const buyShare = total > 0 ? buy / total : 0.5;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-primary">
          {t("buyers", { share: total > 0 ? formatFixed(buyShare * 100, 0) : "—" })}
        </span>
        <span className="text-danger">
          {t("sellers", { share: total > 0 ? formatFixed((1 - buyShare) * 100, 0) : "—" })}
        </span>
      </div>
      <div
        className="flex h-2 overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label={t("takerBarLabel", {
          buy: formatFixed(buy, 1),
          sell: formatFixed(sell, 1),
        })}
      >
        <div
          className="bg-primary transition-[width] duration-700"
          style={{ width: `${buyShare * 100}%` }}
        />
        <div className="flex-1 bg-danger" />
      </div>
    </div>
  );
}
