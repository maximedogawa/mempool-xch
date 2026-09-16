"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useProjectedBlocks } from "@/shared/api/hooks";
import { useTokenList } from "@/shared/api/useTokenList";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import { formatAmount, formatCost, formatFeeRate } from "@/shared/lib/chia/amounts";
import { cn } from "@/shared/lib/cn";
import { shortId } from "@/shared/lib/chia/hex";
import { formatEta } from "@/shared/lib/format/time";
import { formatPrimaryAsset, primaryAsset } from "@/shared/lib/mempool/assets";
import { feeBandFor, FEE_BANDS } from "@/shared/lib/mempool/feeBands";
import type { CompactMempoolItem, TxKindHint } from "@/shared/lib/mempool/types";
import { routes } from "@/shared/lib/routes";
import { squarify } from "@/shared/lib/treemap";
import { AssetAmount, AssetIcon, Card, CardBody, CardHeader, Skeleton } from "@/shared/ui";
import { fetchNftMetadata } from "@/widgets/assets/nftMetadata";

const W = 800;
const H = 170;
/** Cells at least this big get an icon and an amount. */
const ICON_MIN = 54;
const MAX_NFT_LOOKUPS = 12;

type Filter = "all" | TxKindHint;
type ColorMode = "fee" | "kind";
const FILTERS: { id: Filter; label: string }[] = [
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

/**
 * "Goggles" for the next projected block, after mempool.space's block composition view: every
 * spend bundle that will make it into the next transaction block as a cell sized by CLVM cost,
 * coloured by fee band or by asset kind, with the asset's icon (Spacescan CAT icon, NFT
 * thumbnail, XCH/DID/offer/pool glyphs) and its amount in its own unit on cells large enough.
 */
export function NextBlockGoggles() {
  const { blocks, summary, isLoading } = useProjectedBlocks(8);
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<ColorMode>("fee");
  const [hover, setHover] = useState<CompactMempoolItem | null>(null);
  const tokens = useTokenList();
  const next = blocks[0];
  const blockMax = summary?.state.blockMaxCost ?? 11_000_000_000;
  const fillHeight = next ? H * Math.max(0.15, next.fill) : 0;
  const cells = useMemo(() => (next ? squarify(next.items.map((item) => ({ item, weight: item.cost })), W, fillHeight) : []), [next, fillHeight]);

  const perKind = useMemo(() => {
    const acc: Partial<Record<Filter, { count: number; cost: number }>> = { all: { count: next?.items.length ?? 0, cost: next?.totalCost ?? 0 } };
    next?.items.forEach((i) => {
      const k = acc[i.kind] ?? { count: 0, cost: 0 };
      acc[i.kind] = { count: k.count + 1, cost: k.cost + i.cost };
    });
    return acc;
  }, [next]);

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
    ? `Next block composition: ${next.items.length} spend bundles, ${formatCost(next.totalCost)} of ${formatCost(blockMax)} cost, ${formatEta(next.etaSeconds)}`
    : "Next block composition";

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
          <div className="flex flex-wrap items-center gap-1">
            <div role="group" aria-label="Colour cells by" className="mr-2 inline-flex overflow-hidden rounded-full border border-border">
              {(["fee", "kind"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("px-2 py-0.5 text-[11px] font-semibold", mode === m ? "bg-surface-2 text-fg" : "text-fg-muted hover:text-fg")}>
                  {m === "fee" ? "Fee" : "Kind"}
                </button>
              ))}
            </div>
            <div role="group" aria-label="Filter by asset kind" className="flex flex-wrap gap-1">
              {FILTERS.filter((f) => f.id === "all" || (perKind[f.id]?.count ?? 0) > 0).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  title={`${perKind[f.id]?.count ?? 0} bundles · ${formatCost(perKind[f.id]?.cost ?? 0)} cost`}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors",
                    filter === f.id ? "border-primary bg-primary-soft text-primary" : "border-border text-fg-muted hover:text-fg"
                  )}
                >
                  {f.id !== "all" ? <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ background: KIND_COLOR[f.id] }} /> : null}
                  {f.label} <span className="tabular font-normal text-fg-muted">{perKind[f.id]?.count ?? 0}</span>
                  <span className="tabular hidden font-normal text-fg-muted sm:inline">· {formatCost(perKind[f.id]?.cost ?? 0)}</span>
                </button>
              ))}
            </div>
          </div>
        }
      />
      <CardBody>
        {isLoading && !next ? (
          <Skeleton className="h-[120px] w-full" />
        ) : !next ? (
          <p className="py-10 text-center text-sm text-fg-faint">The mempool is empty: the next transaction block will carry no spends.</p>
        ) : (
          <div className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={label} className="block h-auto w-full rounded-sm bg-bg">
              <title>{label}</title>
              <rect x={0} y={fillHeight} width={W} height={Math.max(0, H - fillHeight)} fill="url(#emptyHatch)" />
              <defs>
                <pattern id="emptyHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="var(--border)" strokeWidth="1" />
                </pattern>
              </defs>
              {cells.map((cell, cellIndex) => {
                const item = cell.item;
                const band = feeBandFor(item.feeRate);
                const dim = filter !== "all" && item.kind !== filter;
                const big = cell.width >= ICON_MIN && cell.height >= ICON_MIN;
                const medium = cell.width > 60 && cell.height > 24;
                const fill = mode === "fee" ? `var(${band.cssVar})` : KIND_COLOR[item.kind];
                const primary = primaryAsset(item.assets, item.kind);
                const token = primary.kind === "cat" && primary.assetId ? tokens.data?.[primary.assetId] : undefined;
                const image = item.kind === "nft" && item.assetIds[0] ? nftImage.get(item.assetIds[0]) : null;
                return (
                  <Link key={item.id} href={routes.tx(item.id)} aria-label={`Spend bundle ${shortId(item.id)}, ${item.kind}, ${formatPrimaryAsset(primary, token?.symbol)}, cost ${formatCost(item.cost)}, ${formatFeeRate(item.feeRate)} mojo per cost`}>
                    <g
                      className="treemap-cell"
                      onMouseEnter={() => setHover(item)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover(item)}
                      onBlur={() => setHover(null)}
                      style={{ opacity: dim ? 0.15 : 1, transition: "opacity 200ms", animationDelay: `${Math.min(cellIndex, 40) * 12}ms` }}
                    >
                      <rect x={cell.x + 1} y={cell.y + 1} width={Math.max(0, cell.width - 2)} height={Math.max(0, cell.height - 2)} rx={3} fill={fill} fillOpacity={mode === "fee" ? 0.85 : 0.55} stroke={KIND_COLOR[item.kind]} strokeWidth={item.kind === "xch" ? 0 : 2} />
                      {image && big ? (
                        <>
                          <clipPath id={`clip-${item.id.slice(0, 12)}`}>
                            <rect x={cell.x + 1} y={cell.y + 1} width={Math.max(0, cell.width - 2)} height={Math.max(0, cell.height - 2)} rx={3} />
                          </clipPath>
                          <image href={image} x={cell.x + 1} y={cell.y + 1} width={Math.max(0, cell.width - 2)} height={Math.max(0, cell.height - 2)} preserveAspectRatio="xMidYMid slice" clipPath={`url(#clip-${item.id.slice(0, 12)})`} opacity={0.9} />
                        </>
                      ) : null}
                      {big ? (
                        <foreignObject x={cell.x + 4} y={cell.y + 4} width={Math.max(0, cell.width - 8)} height={Math.max(0, cell.height - 8)} className="pointer-events-none">
                          <div className="flex h-full flex-col justify-between text-[11px] leading-tight text-[#0a0d18]">
                            <div className="flex items-center gap-1 rounded-sm bg-white/70 px-1 py-0.5 backdrop-blur-[1px]">
                              <AssetIcon kind={item.kind} assetId={item.assetIds[0]} size={16} />
                              <span className="mono truncate font-semibold">{shortId(item.id, 5, 3)}</span>
                            </div>
                            <div className="w-fit max-w-full truncate rounded-sm bg-white/70 px-1 py-0.5 font-semibold">
                              <AssetAmount assets={item.assets} kind={item.kind} />
                            </div>
                          </div>
                        </foreignObject>
                      ) : medium ? (
                        <>
                          <text x={cell.x + 6} y={cell.y + 15} fontSize="11" fontWeight="600" fill="#0a0d18" className="pointer-events-none">
                            {shortId(item.id, 5, 3)}
                          </text>
                          <text x={cell.x + 6} y={cell.y + 28} fontSize="10" fill="#0a0d18" fillOpacity="0.8" className="pointer-events-none">
                            {formatCost(item.cost)} · {formatFeeRate(item.feeRate)} m/c
                          </text>
                        </>
                      ) : null}
                    </g>
                  </Link>
                );
              })}
            </svg>
            {hover ? (
              <div role="status" className="pointer-events-none absolute left-2 top-2 rounded-sm border border-border bg-bg-elevated px-2.5 py-2 text-xs shadow-card">
                <div className="mono font-medium text-fg">{shortId(hover.id, 10, 6)}</div>
                <div className="text-fg-muted">
                  {hover.kind.toUpperCase()} · {formatCost(hover.cost)} cost · fee {formatAmount(BigInt(hover.fee))} ({formatFeeRate(hover.feeRate)} m/c)
                </div>
                <div className="text-fg-faint">
                  spends <AssetAmount assets={hover.assets} kind={hover.kind} full /> · {hover.spends} coin spend{hover.spends === 1 ? "" : "s"}
                </div>
              </div>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-fg-faint">
              <span>
                {next.items.length} bundles · {formatCost(next.totalCost)} of {formatCost(blockMax)} cost ({Math.round(next.fill * 100)}%) · fees {formatAmount(next.totalFee)}
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
                <span>outline = kind · icon and amount on large cells</span>
              </span>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
