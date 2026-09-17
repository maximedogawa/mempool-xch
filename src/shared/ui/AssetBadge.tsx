"use client";

import { ArrowLeftRight, Fingerprint, Hexagon, Image as ImageIcon, HelpCircle, Pickaxe } from "lucide-react";
import { useState } from "react";
import { dexieIconUrl } from "@/shared/api/tokenList";
import { useAsset } from "@/shared/api/useTokenList";
import { cn } from "@/shared/lib/cn";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import { isHttpsUrl, isTrustedImageUrl } from "@/shared/lib/trustedImage";
import { KindBadge } from "./Badge";

/**
 * Icon for an asset kind. No icon for XCH: the native asset does not need a badge to be
 * recognised. CAT icons: an explicit `iconUrl` (what the Sage wallet already resolved), else the
 * registry's, else Dexie's deterministic per-id icon; a two-letter badge when the image does not
 * exist.
 */
export function AssetIcon({ kind, assetId, iconUrl, size = 18, className }: { kind: TxKindHint; assetId?: string; iconUrl?: string | null; size?: number; className?: string }) {
  const token = useAsset(kind === "cat" ? assetId : undefined);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  if (kind === "xch") return null;
  if (kind === "cat") {
    // Candidates in order: what the wallet resolved, the registry, Dexie's per-id icon. A blocked
    // or missing image (Sage CSP, 404) moves on to the next one before the letter badge. The
    // wallet-resolved icon only needs https (it comes through the Sage bridge, not a remote
    // page's own content, src/shared/lib/sage/wallet.ts applies the same check at its source);
    // the registry and Dexie candidates are also host-restricted since they're not always
    // constructed in-app (TASK-051).
    const candidates = [
      iconUrl && isHttpsUrl(iconUrl) ? iconUrl : null,
      token?.iconUrl && isTrustedImageUrl(token.iconUrl) ? token.iconUrl : null,
      assetId ? dexieIconUrl(assetId) : null,
    ].filter((u): u is string => !!u);
    const src = candidates.find((u) => !failed.has(u)) ?? null;
    if (src) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={token?.name ?? "CAT"} loading="lazy" decoding="async" onError={() => setFailed((prev) => new Set(prev).add(src))} className={cn("shrink-0 rounded-full bg-surface-2 object-cover", className)} style={{ width: size, height: size }} />
      );
    }
    return (
      <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--kind-cat)_15%,transparent)] text-[9px] font-bold text-kind-cat", className)} style={{ width: size, height: size }}>
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

/** Kind badge with the asset icon in front and the CAT ticker when the registry knows it. */
export function AssetBadge({ kind, assetId, className }: { kind: TxKindHint; assetId?: string; className?: string }) {
  const token = useAsset(kind === "cat" ? assetId : undefined);
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
