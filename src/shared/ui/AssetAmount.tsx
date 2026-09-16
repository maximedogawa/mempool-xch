"use client";

import { useTokenList } from "@/shared/api/useTokenList";
import { formatAssets, formatPrimaryAsset, primaryAsset, safeAssets } from "@/shared/lib/mempool/assets";
import type { CompactAssets, TxKindHint } from "@/shared/lib/mempool/types";
import { cn } from "@/shared/lib/cn";

/** A bundle's spent assets in their own units; the primary asset inline, everything in the title. */
export function AssetAmount({ assets: input, kind, className, full = false }: { assets: CompactAssets | undefined; kind?: TxKindHint; className?: string; full?: boolean }) {
  const tokens = useTokenList();
  const assets = safeAssets(input);
  const tickers = Object.fromEntries(assets.cats.map((c) => [c.assetId, tokens.data?.[c.assetId]?.symbol]));
  const primary = primaryAsset(assets, kind);
  const all = formatAssets(assets, tickers);
  const text = full ? all : formatPrimaryAsset(primary, primary.assetId ? tickers[primary.assetId] : undefined);
  return (
    <span className={cn("tabular", className)} title={all}>
      {text}
    </span>
  );
}
