/**
 * Asset images (CAT icons, NFT thumbnails) come from URLs embedded in third-party data — Dexie's
 * token registry, MintGarden's NFT/collection metadata, and NFT metadata_json itself, which an
 * NFT's creator fully controls. Loading an unrecognised host automatically lets attacker-chosen
 * metadata make a visitor's browser fetch an arbitrary URL just by viewing an asset:
 * a tracking/fingerprinting vector, and a mixed-content/MITM one over plain http. Only load images
 * from hosts the app already depends on for this data.
 *
 * This site never hosts, proxies or caches that media. Every asset URL is handed to the browser
 * as-is and fetched from its own origin (MintGarden, IPFS via MintGarden's gateway, Dexie), so
 * the bytes never pass through, and are never stored by, mempoolxch.space: what a third party
 * takes down is gone here the moment they take it down, and this site is not its publisher.
 * That is why next/image is banned (eslint.config.mjs) and image optimisation is off
 * (next.config.ts), and why nothing here writes media to storage or a service worker cache.
 */
/** Also used to build the hosted app's CSP img-src (next.config.ts) — one source of truth. */
export const TRUSTED_IMAGE_HOSTS = new Set([
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

const VIDEO_EXTENSIONS = /\.(mp4|webm|ogv|m4v|mov)(\?|#|$)/i;

/**
 * A trusted https URL that names a video file. NFT `data_uris` carry the artwork itself, which
 * is a video often enough (CHIP-0007 data_type 3) that feeding it to an <img> shows nothing.
 */
export function isTrustedVideoUrl(url: string): boolean {
  return isTrustedImageUrl(url) && VIDEO_EXTENSIONS.test(new URL(url).pathname);
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
