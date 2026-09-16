"use client";

import { ArrowLeftRight, Fingerprint, Hexagon, Image as ImageIcon, HelpCircle, Pickaxe } from "lucide-react";
import { useTokenList } from "@/shared/api/useTokenList";
import { cn } from "@/shared/lib/cn";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import { AssetImage } from "./AssetImage";
import { KindBadge } from "./Badge";

/** Original XCH mark: a green disc with a leaf. */
export function XchIcon({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={cn("shrink-0", className)}>
      <circle cx="12" cy="12" r="11" fill="var(--primary-strong)" />
      <circle cx="12" cy="12" r="11" fill="url(#xchShine)" opacity="0.35" />
      <path d="M7.2 14.6c1.9-4.4 5.6-6.4 10-6.1-1.1 4.6-4.4 7.4-9.1 7-0.3 0-0.6-0.1-0.9-0.1 0.9-1.9 2.6-3.3 4.6-4.1-2.1 0.4-3.6 1.4-4.6 3.3z" fill="#f2fff5" />
      <defs>
        <radialGradient id="xchShine" cx="0.3" cy="0.25" r="0.8">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/** Icon for an asset kind; CAT icons come from the Spacescan token list when known. */
export function AssetIcon({ kind, assetId, size = 18, className }: { kind: TxKindHint; assetId?: string; size?: number; className?: string }) {
  const tokens = useTokenList();
  const token = kind === "cat" && assetId ? tokens.data?.[assetId] : undefined;
  if (kind === "xch") return <XchIcon size={size} className={className} />;
  if (kind === "cat") {
    if (token?.iconUrl) {
      return <AssetImage urls={[token.iconUrl]} alt={token.name} className={cn("shrink-0", className)} rounded="rounded-full" style={{ width: size, height: size }} />;
    }
    return (
      <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--kind-cat)_25%,transparent)] text-[9px] font-bold text-kind-cat", className)} style={{ width: size, height: size }}>
        {token?.symbol?.slice(0, 2) ?? "C"}
      </span>
    );
  }
  const Icon = kind === "nft" ? ImageIcon : kind === "did" ? Fingerprint : kind === "offer" ? ArrowLeftRight : kind === "pool" ? Pickaxe : kind === "singleton" ? Hexagon : HelpCircle;
  const tone =
    kind === "nft"
      ? "text-kind-nft bg-[color-mix(in_srgb,var(--kind-nft)_20%,transparent)]"
      : kind === "did" || kind === "singleton"
        ? "text-kind-did bg-[color-mix(in_srgb,var(--kind-did)_20%,transparent)]"
        : kind === "offer"
          ? "text-kind-offer bg-[color-mix(in_srgb,var(--kind-offer)_20%,transparent)]"
          : kind === "pool"
            ? "text-info bg-[color-mix(in_srgb,var(--info)_20%,transparent)]"
            : "text-fg-faint bg-surface-2";
  return (
    <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center rounded-full", tone, className)} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.6)} />
    </span>
  );
}

/** Kind badge with the asset icon in front and the CAT ticker when Spacescan knows it. */
export function AssetBadge({ kind, assetId, className }: { kind: TxKindHint; assetId?: string; className?: string }) {
  const tokens = useTokenList();
  const token = kind === "cat" && assetId ? tokens.data?.[assetId] : undefined;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={token ? `${token.name} (${token.symbol})` : undefined}>
      <AssetIcon kind={kind} assetId={assetId} />
      {token ? (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-transparent bg-[color-mix(in_srgb,var(--kind-cat)_15%,transparent)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-kind-cat">
          {token.symbol}
        </span>
      ) : (
        <KindBadge kind={kind} />
      )}
    </span>
  );
}
