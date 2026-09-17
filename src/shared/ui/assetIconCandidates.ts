import { isHttpsUrl, isTrustedImageUrl } from "@/shared/lib/trustedImage";

/**
 * Candidate icon URLs in try-then-fallback order, filtered by trust. Pulled out of
 * AssetIcon (src/shared/ui/AssetBadge.tsx) so the ordering can be unit tested without rendering.
 */

/** What the Sage wallet resolved (https-only, an authenticated channel), then the registry's icon, then Dexie's deterministic per-id icon. */
export function catIconCandidates(opts: {
  walletIconUrl?: string | null;
  registryIconUrl?: string | null;
  dexieIconUrl?: string | null;
}): string[] {
  return [
    opts.walletIconUrl && isHttpsUrl(opts.walletIconUrl) ? opts.walletIconUrl : null,
    opts.registryIconUrl && isTrustedImageUrl(opts.registryIconUrl) ? opts.registryIconUrl : null,
    opts.dexieIconUrl,
  ].filter((u): u is string => !!u);
}

/** The direct MintGarden thumbnail redirect, then the full record's own image candidates (fetched only once the thumbnail fails). */
export function nftIconCandidates(opts: { thumbnailUrl: string | null; fallbackImageUrls: string[] }): string[] {
  return [opts.thumbnailUrl, ...opts.fallbackImageUrls].filter((u): u is string => !!u && isTrustedImageUrl(u));
}
