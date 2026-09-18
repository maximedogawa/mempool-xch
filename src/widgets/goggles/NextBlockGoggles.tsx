"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProjectedBlocks } from "@/shared/api/hooks";
import { useTokenList } from "@/shared/api/useTokenList";
import { useWalletPendingIds } from "@/shared/lib/sage/usePendingIds";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import { formatAmount, formatCost, formatFeeRate, formatPercent } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { shortId } from "@/shared/lib/chia/hex";
import { formatAge, formatEta } from "@/shared/lib/format/time";
import { formatPrimaryAsset, primaryAsset } from "@/shared/lib/mempool/assets";
import { feeBandFor, FEE_BANDS } from "@/shared/lib/mempool/feeBands";
import type { CompactMempoolItem, TxKindHint } from "@/shared/lib/mempool/types";
import { routes } from "@/shared/lib/routes";
import { squarify } from "@/shared/lib/treemap";
import { AssetAmount, AssetIcon, Card, CardBody, CardHeader, Skeleton } from "@/shared/ui";
import { fetchNftMetadata } from "@/widgets/assets/nftMetadata";

const W = 800;
const H = 190;
/** Cells at least this big get an icon and an amount; above TEXT_MIN just the amount. */
const ICON_MIN = 48;
const TEXT_MIN_W = 58;
const TEXT_MIN_H = 22;
const MAX_NFT_LOOKUPS = 12;
/** Bundles first seen more recently than this count as "new" and get the arrival highlight. */
const FRESH_MS = 90_000;

type KindFilter = "all" | TxKindHint;
type FeeFilter = "any" | (typeof FEE_BANDS)[number]["id"];
type OnlyFilter = "all" | "new" | "yours";
type ColorMode = "fee" | "kind";

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "xch", label: "XCH" },
  { id: "cat", label: "CAT" },
  { id: "nft", label: "NFT" },
  { id: "offer", label: "Offers" },
  { id: "did", label: "DID" },
  { id: "pool", label: "Pool" },
  { id: "singleton", label: "Singleton" },
];

export const KIND_COLOR: Record<TxKindHint, string> = {
  xch: "var(--kind-xch)",
  cat: "var(--kind-cat)",
  nft: "var(--kind-nft)",
  did: "var(--kind-did)",
  offer: "var(--kind-offer)",
  pool: "var(--info)",
  singleton: "var(--kind-did)",
  unknown: "var(--kind-unknown)",
};

function Chip({ active, onClick, title, swatch, children }: { active: boolean; onClick: () => void; title?: string; swatch?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold transition-colors",
        active ? "border-primary bg-primary-soft text-primary" : "border-border text-fg-muted hover:border-border-strong hover:text-fg"
      )}
    >
      {swatch ? <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: swatch }} /> : null}
      {children}
    </button>
  );
}

/**
 * "Goggles" for the next projected block, after mempool.space's block composition view. The
 * block fills from the bottom up as bundles arrive: every spend bundle that will make the next
 * transaction block is a cell sized by CLVM cost, coloured by fee band or asset kind, showing
 * its asset icon and amount when large enough (ids live in the hover card, not on the cells).
 * Cells glide to their new spot and new arrivals pop in via the CSS in globals.css; nothing is
 * animated per frame in JavaScript.
 */
export function NextBlockGoggles() {
  const { blocks, summary, isLoading } = useProjectedBlocks(8);
  const [kind, setKind] = useState<KindFilter>("all");
  const [fee, setFee] = useState<FeeFilter>("any");
  const [only, setOnly] = useState<OnlyFilter>("all");
  const [mode, setMode] = useState<ColorMode>("fee");
  const [hover, setHover] = useState<CompactMempoolItem | null>(null);
  const tokens = useTokenList();
  const mine = useWalletPendingIds();
  const next = blocks[0];
  const blockMax = summary?.state.blockMaxCost ?? 11_000_000_000;

  // "New" is relative to now; tick once a minute so highlights expire without a data refresh.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => setNow(Date.now()), [next]);
  // Everything in the first snapshot was already waiting when this tab opened: only bundles
  // observed after it count as arrivals.
  const baseline = useRef<number | null>(null);
  if (summary && baseline.current === null) baseline.current = summary.generatedAt;

  const fillHeight = next ? Math.round(H * Math.max(0.16, next.fill)) : 0;
  const top = H - fillHeight;
  const cells = useMemo(() => (next ? squarify(next.items.map((item) => ({ item, weight: item.cost })), W, fillHeight) : []), [next, fillHeight]);

  const perKind = useMemo(() => {
    const acc: Partial<Record<KindFilter, { count: number; cost: number }>> = { all: { count: next?.items.length ?? 0, cost: next?.totalCost ?? 0 } };
    next?.items.forEach((i) => {
      const k = acc[i.kind] ?? { count: 0, cost: 0 };
      acc[i.kind] = { count: k.count + 1, cost: k.cost + i.cost };
    });
    return acc;
  }, [next]);
  const perBand = useMemo(() => {
    const acc: Record<string, number> = {};
    next?.items.forEach((i) => {
      const id = feeBandFor(i.feeRate).id;
      acc[id] = (acc[id] ?? 0) + 1;
    });
    return acc;
  }, [next]);
  const isFresh = (item: CompactMempoolItem) => baseline.current !== null && item.firstSeen > baseline.current && now - item.firstSeen < FRESH_MS;
  const freshCount = next ? next.items.filter(isFresh).length : 0;
  const yoursCount = next ? next.items.filter((i) => mine.has(i.id)).length : 0;

  const matches = (item: CompactMempoolItem) =>
    (kind === "all" || item.kind === kind) && (fee === "any" || feeBandFor(item.feeRate).id === fee) && (only === "all" || (only === "new" ? isFresh(item) : mine.has(item.id)));
  const filtering = kind !== "all" || fee !== "any" || only !== "all";
  const matched = filtering && next ? next.items.filter(matches) : [];

  // NFT thumbnails for the largest NFT cells only (one metadata call each, cached).
  const nftLaunchers = useMemo(
    () => cells.filter((c) => c.item.kind === "nft" && c.item.assetIds[0] && c.width >= ICON_MIN && c.height >= ICON_MIN).slice(0, MAX_NFT_LOOKUPS).map((c) => c.item.assetIds[0]!),
    [cells]
  );
  const nftMeta = useQueries({
    queries: nftLaunchers.map((launcher) => ({
      queryKey: ["nftMeta", launcher],
      queryFn: () => fetchNftMetadata(launcherIdToNftId(launcher)),
      staleTime: Infinity,
      retry: false,
    })),
  });
  const nftImage = new Map(nftLaunchers.map((l, i) => [l, nftMeta[i]?.data?.imageUrls[0] ?? null]));

  const label = next
    ? `Next block composition: ${next.items.length} spend bundles, ${formatCost(next.totalCost)} of ${formatCost(blockMax)} cost (${formatPercent(next.fill)} full), ${formatEta(next.etaSeconds)}`
    : "Next block composition";
  const fillTone = next ? (next.fill > 0.9 ? "var(--fee-5)" : next.fill > 0.6 ? "var(--fee-3)" : "var(--primary)") : "var(--primary)";

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            Next block
            {next ? <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] normal-case tracking-normal text-primary">{formatEta(next.etaSeconds)}</span> : null}
          </span>
        }
        action={
          <div role="group" aria-label="Colour cells by" className="inline-flex overflow-hidden rounded-full border border-border">
            {(["fee", "kind"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("px-2.5 py-0.5 text-[11px] font-semibold transition-colors", mode === m ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg")}>
                {m === "fee" ? "Fee" : "Kind"}
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="flex flex-col gap-3">
        {isLoading && !next ? (
          <Skeleton className="h-[190px] w-full" />
        ) : !next ? (
          <p className="py-10 text-center text-sm text-fg-faint">The mempool is empty: the next transaction block will carry no spends.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <div className="flex items-baseline gap-2">
                <span className="tabular text-2xl font-semibold leading-none transition-colors" style={{ color: fillTone }} data-testid="goggles-fill">
                  {formatPercent(next.fill)}
                </span>
                <span className="text-xs text-fg-muted">
                  full · {formatCost(next.totalCost)} of {formatCost(blockMax)} cost
                </span>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-3 text-xs text-fg-muted">
                <span>
                  <span className="tabular font-semibold text-fg">{next.items.length}</span> bundles
                </span>
                <span>
                  fees <span className="tabular font-semibold text-fg">{formatAmount(next.totalFee)}</span>
                </span>
                {freshCount > 0 ? (
                  <span className="text-primary">
                    <span className="tabular font-semibold">+{freshCount}</span> in the last {Math.round(FRESH_MS / 1000)} s
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <div role="group" aria-label="Filter by asset kind" className="flex flex-wrap items-center gap-1">
                {KIND_FILTERS.filter((f) => f.id === "all" || (perKind[f.id]?.count ?? 0) > 0).map((f) => (
                  <Chip key={f.id} active={kind === f.id} onClick={() => setKind(f.id)} title={`${perKind[f.id]?.count ?? 0} bundles · ${formatCost(perKind[f.id]?.cost ?? 0)} cost`} swatch={f.id !== "all" ? KIND_COLOR[f.id] : undefined}>
                    {f.label} <span className="tabular font-normal text-fg-muted">{perKind[f.id]?.count ?? 0}</span>
                  </Chip>
                ))}
              </div>
              <div role="group" aria-label="Filter by fee band" className="flex flex-wrap items-center gap-1">
                <Chip active={fee === "any"} onClick={() => setFee("any")}>
                  Any fee
                </Chip>
                {FEE_BANDS.filter((b) => (perBand[b.id] ?? 0) > 0).map((b) => (
                  <Chip key={b.id} active={fee === b.id} onClick={() => setFee(b.id)} title={`${b.label} mojo per cost`} swatch={`var(${b.cssVar})`}>
                    {b.id === "zero" ? "0 fee" : `${b.label} m/c`} <span className="tabular font-normal text-fg-muted">{perBand[b.id]}</span>
                  </Chip>
                ))}
              </div>
              {freshCount > 0 || yoursCount > 0 ? (
                <div role="group" aria-label="Show only" className="flex flex-wrap items-center gap-1">
                  {freshCount > 0 ? (
                    <Chip active={only === "new"} onClick={() => setOnly(only === "new" ? "all" : "new")}>
                      New <span className="tabular font-normal text-fg-muted">{freshCount}</span>
                    </Chip>
                  ) : null}
                  {yoursCount > 0 ? (
                    <Chip active={only === "yours"} onClick={() => setOnly(only === "yours" ? "all" : "yours")}>
                      Yours <span className="tabular font-normal text-fg-muted">{yoursCount}</span>
                    </Chip>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label} className="block h-auto w-full overflow-hidden rounded-card bg-bg">
                <title>{label}</title>
                <defs>
                  <pattern id="emptyHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="10" stroke="var(--border)" strokeWidth="1" />
                  </pattern>
                  <linearGradient id="fillGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={fillTone} stopOpacity="0.28" />
                    <stop offset="1" stopColor={fillTone} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Empty capacity above the fill line; both rects glide as the block fills. */}
                <rect className="goggles-glide" x={0} y={0} width={W} height={Math.max(0, top)} fill="url(#emptyHatch)" />
                <rect className="goggles-glide" x={0} y={top} width={W} height={14} fill="url(#fillGlow)" />
                <rect className="goggles-glide" x={0} y={top} width={W} height={1.5} fill={fillTone} fillOpacity={0.9} />
                {cells.map((cell, cellIndex) => {
                  const item = cell.item;
                  const band = feeBandFor(item.feeRate);
                  const dim = filtering && !matches(item);
                  const cx = cell.x;
                  const cy = cell.y + top;
                  const big = cell.width >= ICON_MIN && cell.height >= ICON_MIN;
                  const medium = !big && cell.width >= TEXT_MIN_W && cell.height >= TEXT_MIN_H;
                  const fill = mode === "fee" ? `var(${band.cssVar})` : KIND_COLOR[item.kind];
                  const primary = primaryAsset(item.assets, item.kind);
                  const token = primary.kind === "cat" && primary.assetId ? tokens.data?.[primary.assetId] : undefined;
                  const amountText = formatPrimaryAsset(primary, token?.symbol);
                  const image = item.kind === "nft" && item.assetIds[0] ? nftImage.get(item.assetIds[0]) : null;
                  const yours = mine.has(item.id);
                  const fresh = isFresh(item);
                  const inner = { x: cx + 1, y: cy + 1, width: Math.max(0, cell.width - 2), height: Math.max(0, cell.height - 2) };
                  return (
                    <Link key={item.id} href={routes.tx(item.id)} aria-label={`${yours ? "Your " : ""}spend bundle ${shortId(item.id)}, ${item.kind}, ${amountText}, cost ${formatCost(item.cost)}, ${formatFeeRate(item.feeRate)} mojo per cost`}>
                      <g
                        className={cn("treemap-cell", fresh && "treemap-cell-fresh")}
                        onMouseEnter={() => setHover(item)}
                        onMouseLeave={() => setHover(null)}
                        onFocus={() => setHover(item)}
                        onBlur={() => setHover(null)}
                        style={{ opacity: dim ? 0.12 : 1, transition: "opacity 200ms", animationDelay: `${Math.min(cellIndex, 40) * 12}ms` }}
                      >
                        <rect {...inner} rx={3} fill={fill} fillOpacity={mode === "fee" ? 0.88 : 0.6} stroke={KIND_COLOR[item.kind]} strokeWidth={item.kind === "xch" ? 0 : 1.5} />
                        {image && big ? (
                          <>
                            <clipPath id={`clip-${item.id.slice(0, 12)}`}>
                              <rect {...inner} rx={3} />
                            </clipPath>
                            <image href={image} {...inner} preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${item.id.slice(0, 12)})`} opacity={0.9} />
                          </>
                        ) : null}
                        {fresh ? <rect className="treemap-fresh-ring" {...inner} rx={3} fill="none" stroke="#fff" strokeWidth={1.5} /> : null}
                        {yours ? (
                          <>
                            <rect x={cx + 2} y={cy + 2} width={Math.max(0, cell.width - 4)} height={Math.max(0, cell.height - 4)} rx={3} fill="none" stroke="var(--primary)" strokeWidth={3} className="animate-pulse" />
                            {cell.width >= 40 && cell.height >= 18 ? (
                              <>
                                <rect x={cx + cell.width - 34} y={cy + 4} width={29} height={12} rx={6} fill="var(--primary)" />
                                <text x={cx + cell.width - 19.5} y={cy + 13} fontSize="8" fontWeight="700" textAnchor="middle" fill="#0a0d18" className="pointer-events-none">
                                  YOURS
                                </text>
                              </>
                            ) : null}
                          </>
                        ) : null}
                        {big ? (
                          <foreignObject x={cx + 4} y={cy + 4} width={Math.max(0, cell.width - 8)} height={Math.max(0, cell.height - 8)} className="pointer-events-none">
                            <div className="flex h-full flex-col justify-between text-[11px] leading-tight text-[#0a0d18]">
                              <div className="w-fit rounded-sm bg-white/80 p-0.5">
                                <AssetIcon kind={item.kind} assetId={item.assetIds[0]} size={16} />
                              </div>
                              <div className="w-fit max-w-full truncate rounded-sm bg-white/80 px-1 py-0.5 font-semibold">
                                <AssetAmount assets={item.assets} kind={item.kind} />
                              </div>
                            </div>
                          </foreignObject>
                        ) : medium ? (
                          <text x={cx + cell.width / 2} y={cy + cell.height / 2 + 4} fontSize="10.5" fontWeight="600" textAnchor="middle" fill="#0a0d18" className="pointer-events-none">
                            {amountText.length > Math.floor(cell.width / 6.2) ? `${amountText.slice(0, Math.max(3, Math.floor(cell.width / 6.2) - 1))}…` : amountText}
                          </text>
                        ) : null}
                      </g>
                    </Link>
                  );
                })}
              </svg>
              {hover ? (
                <div role="status" className="pointer-events-none absolute right-2 top-2 max-w-[min(320px,calc(100%-1rem))] rounded-sm border border-border bg-bg-elevated/95 px-2.5 py-2 text-xs shadow-card">
                  <div className="flex items-center gap-1.5">
                    <AssetIcon kind={hover.kind} assetId={hover.assetIds[0]} size={14} />
                    <span className="font-semibold text-fg">
                      <AssetAmount assets={hover.assets} kind={hover.kind} full />
                    </span>
                    {mine.has(hover.id) ? <span className="rounded-full bg-primary px-1.5 text-[9px] font-bold uppercase text-[#0a0d18]">yours</span> : null}
                  </div>
                  <div className="mono mt-0.5 text-fg-muted">{shortId(hover.id, 10, 6)}</div>
                  <div className="text-fg-muted">
                    {formatCost(hover.cost)} cost · fee {formatAmount(BigInt(hover.fee))} · {formatFeeRate(hover.feeRate)} m/c
                  </div>
                  <div className="text-fg-faint">
                    {hover.spends} coin spend{hover.spends === 1 ? "" : "s"} · seen {formatAge(hover.firstSeen)}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-faint">
              <span aria-live="polite">
                {filtering ? (
                  <>
                    Showing <span className="tabular font-medium text-fg-muted">{matched.length}</span> of {next.items.length} bundles · {formatCost(matched.reduce((s, i) => s + i.cost, 0))} cost
                  </>
                ) : (
                  <>Bundles are packed by fee per cost, the same order the node uses; the block fills from the bottom up.</>
                )}
              </span>
              <span className="inline-flex flex-wrap items-center gap-2">
                <span>size = cost</span>
                <span>·</span>
                {mode === "fee" ? (
                  <span className="inline-flex items-center gap-1">
                    colour = fee band
                    {FEE_BANDS.map((b) => (
                      <span key={b.id} aria-hidden="true" className="inline-block h-2 w-2 rounded-sm" style={{ background: `var(${b.cssVar})` }} title={`${b.label} mojo/cost`} />
                    ))}
                  </span>
                ) : (
                  <span>colour = asset kind</span>
                )}
                <span>·</span>
                <span>white ring = new</span>
              </span>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
