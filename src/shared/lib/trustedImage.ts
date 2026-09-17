/**
 * Asset images (CAT icons, NFT thumbnails) come from URLs embedded in third-party data — Dexie's
 * token registry, MintGarden's NFT/collection metadata, and NFT metadata_json itself, which an
 * NFT's creator fully controls. Loading an unrecognised host automatically lets attacker-chosen
 * metadata make a visitor's browser fetch an arbitrary URL just by viewing an asset (TASK-051):
 * a tracking/fingerprinting vector, and a mixed-content/MITM one over plain http. Only load images
 * from hosts the app already depends on for this data.
 */
const TRUSTED_IMAGE_HOSTS = new Set([
  "icons.dexie.space",
  "assets.mainnet.mintgarden.io",
  "ipfs.mintgarden.io",
  // MintGarden's own API — /nfts/{id}/thumbnail 307-redirects to assets.mainnet.mintgarden.io,
  // but the initial request (what <img src> actually points at) is this host.
  "api.mintgarden.io",
]);

/** https + a trusted host. Use for any URL sourced from Dexie or MintGarden data (icons, NFT/collection thumbnails). */
export function isTrustedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && TRUSTED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * https only, any host. Use only for a URL sourced from an authenticated channel that isn't a
 * remote webpage's own content — the Sage wallet bridge's own icon_url is the one case in this
 * app (src/shared/lib/sage/wallet.ts), which already applies this same check at its source.
 */
export function isHttpsUrl(url: string): boolean {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
