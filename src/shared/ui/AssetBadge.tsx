"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  Fingerprint,
  Hexagon,
  Image as ImageIcon,
  HelpCircle,
  Pickaxe,
} from "lucide-react";
import { useState } from "react";
import { dexieIconUrl } from "@/shared/api/tokenList";
import { useAsset } from "@/shared/api/useTokenList";
import { launcherIdToNftId } from "@/shared/lib/chia/address";
import { cn } from "@/shared/lib/cn";
import type { TxKindHint } from "@/shared/lib/mempool/types";
import { fetchNftImageUrls, mintGardenThumbnailUrl } from "@/shared/lib/nft/mintgarden";
import { isVeiled, type Sensitivity } from "@/shared/lib/nft/sensitivity";
import { catIconCandidates, nftIconCandidates } from "./assetIconCandidates";
import { KindBadge } from "./Badge";

/**
 * Icon for an asset kind. No icon for XCH: the native asset does not need a badge to be
 * recognised. CAT icons: an explicit `iconUrl` (what the Sage wallet already resolved), else the
 * registry's, else Dexie's deterministic per-id icon; a two-letter badge when the image does not
 * exist.
 */
export function AssetIcon({
  kind,
  assetId,
  iconUrl,
  size = 18,
  className,
  sensitivity,
}: {
  kind: TxKindHint;
  assetId?: string;
  iconUrl?: string | null;
  size?: number;
  className?: string;
  /** A caller that already knows MintGarden's verdict; flagged art gives way to the glyph. */
  sensitivity?: Sensitivity | null;
}) {
  const token = useAsset(kind === "cat" ? assetId : undefined);
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  // NFT thumbnails: assetId is the 32-byte launcher id (same field CAT asset ids use,
  // src/shared/lib/sage/wallet.ts and src/widgets/goggles/NextBlockGoggles.tsx both pass it this
  // way). The direct thumbnail redirect is the primary candidate (no fetch); the full record's
  // own image is fetched as a fallback only once that 404s, not on every render.
  // An icon this small cannot carry a veil or its reason, so flagged artwork is simply not
  // shown: the neutral NFT glyph below takes its place, and no image is requested.
  const nftId =
    kind === "nft" && assetId && !isVeiled(sensitivity) ? launcherIdToNftId(assetId) : null;
  const primaryNftThumbnail = nftId ? mintGardenThumbnailUrl(nftId) : null;
  const [nftThumbnailFailed, setNftThumbnailFailed] = useState(false);
  const nftFallback = useQuery({
    queryKey: ["nft-icon-fallback", nftId],
    queryFn: () => fetchNftImageUrls(nftId!),
    enabled: nftThumbnailFailed && !!nftId,
    staleTime: 5 * 60_000,
  });
  if (kind === "xch") return null;
  if (kind === "cat") {
    // A blocked or missing image (Sage CSP, 404) moves on to the next candidate before the letter badge.
    const candidates = catIconCandidates({
      walletIconUrl: iconUrl,
      registryIconUrl: token?.iconUrl,
      dexieIconUrl: assetId ? dexieIconUrl(assetId) : null,
    });
    const src = candidates.find((u) => !failed.has(u)) ?? null;
    if (src) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={token?.name ?? "CAT"}
          loading="lazy"
          decoding="async"
          onError={() => setFailed((prev) => new Set(prev).add(src))}
          className={cn("shrink-0 rounded-full bg-surface-2 object-cover", className)}
          style={{ width: size, height: size }}
        />
      );
    }
    return (
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--kind-cat)_15%,transparent)] text-[9px] font-bold text-kind-cat",
          className
        )}
        style={{ width: size, height: size }}
      >
        {token?.symbol?.slice(0, 2) ?? "C"}
      </span>
    );
  }
  if (kind === "nft" && nftId) {
    const candidates = nftIconCandidates({
      thumbnailUrl: primaryNftThumbnail,
      fallbackImageUrls: nftFallback.data ?? [],
    });
    const src = candidates.find((u) => !failed.has(u)) ?? null;
    if (src) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="NFT"
          loading="lazy"
          decoding="async"
          onError={() => {
            setFailed((prev) => new Set(prev).add(src));
            if (src === primaryNftThumbnail) setNftThumbnailFailed(true);
          }}
          className={cn("shrink-0 rounded-full bg-surface-2 object-cover", className)}
          style={{ width: size, height: size }}
        />
      );
    }
  }
  const Icon =
    kind === "nft"
      ? ImageIcon
      : kind === "did"
        ? Fingerprint
        : kind === "offer"
          ? ArrowLeftRight
          : kind === "pool"
            ? Pickaxe
            : kind === "singleton"
              ? Hexagon
              : HelpCircle;
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
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        tone,
        className
      )}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.6)} />
    </span>
  );
}

/** Kind badge with the asset icon in front and the CAT ticker when the registry knows it. */
export function AssetBadge({
  kind,
  assetId,
  className,
}: {
  kind: TxKindHint;
  assetId?: string;
  className?: string;
}) {
  const token = useAsset(kind === "cat" ? assetId : undefined);
  return (
    <span
      className={cn("inline-flex items-center gap-1.5", className)}
      title={token ? `${token.name} (${token.symbol})` : undefined}
    >
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
