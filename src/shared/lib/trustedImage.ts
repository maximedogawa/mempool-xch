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
/** A file that says it is something other than a video, whatever the record claims. */
const NON_VIDEO_EXTENSIONS =
  /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|mp3|wav|ogg|oga|flac|m4a|aac|html?|json|txt|pdf|glb|gltf)(\?|#|$)/i;

/**
 * MintGarden's `data_type` for video artwork. The OpenAPI schema (NftDataType) lists 0-4 with
 * no meaning; its own NFT page renders 3 as a <video> and 4 as an <audio> (checked in the
 * mintgarden.io bundle 2026-09-23), and every data_type 3 record sampled that day, several
 * hundred, pointed at an mp4 or mov. The meaning of the other values is in the wiki
 * (architecture/data-sources.md, "Third-party media is never hosted here").
 */
export const MINTGARDEN_VIDEO_DATA_TYPE = 3;

/**
 * A trusted https URL whose artwork is a video. NFT `data_uris` carry the artwork itself, which
 * is a video often enough that feeding it to an <img> shows nothing. The file extension decides
 * when there is one; a data_uri with none (an IPFS gateway serving a bare CID) is a video when
 * MintGarden's record says so with `dataType` 3. Pass `dataType` only for the record's own
 * data_uris, never for a thumbnail or preview, which describe a still.
 */
export function isTrustedVideoUrl(url: string, dataType?: unknown): boolean {
  if (!isTrustedImageUrl(url)) return false;
  const path = new URL(url).pathname;
  if (VIDEO_EXTENSIONS.test(path)) return true;
  return dataType === MINTGARDEN_VIDEO_DATA_TYPE && !NON_VIDEO_EXTENSIONS.test(path);
}

/** CIDv0 (base58 Qm…) or a base32 CIDv1 (b…), the two forms NFT data_uris carry. */
const CID = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{50,})$/;
const MINTGARDEN_IPFS = "https://ipfs.mintgarden.io/ipfs/";

/**
 * The same IPFS content on MintGarden's gateway, a trusted host, or null when `uri` is not an
 * IPFS reference. An IPFS address names its bytes by hash, so any gateway serves the identical
 * file: re-pointing lets a video minted on some other gateway play without trusting that
 * gateway. Understands ipfs://<cid>/path, https://<gateway>/ipfs/<cid>/path and the subdomain
 * form https://<cid>.ipfs.<gateway>/path; the path is kept, a query or fragment is dropped.
 */
export function mintGardenIpfsUrl(uri: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(uri);
  } catch {
    return null;
  }
  let cid: string | undefined;
  let rest = "";
  if (parsed.protocol === "ipfs:") {
    // Read from the raw string: URL puts the CID in the host, and a CIDv0 must keep its case.
    const parts = (uri.replace(/^ipfs:\/\/(ipfs\/)?/i, "").split(/[?#]/)[0] ?? "").split("/");
    cid = parts[0];
    rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  } else if (parsed.protocol === "https:") {
    const sub = parsed.hostname.match(/^([a-z0-9]+)\.ipfs\./);
    if (sub) {
      cid = sub[1];
      rest = parsed.pathname === "/" ? "" : parsed.pathname;
    } else {
      const path = parsed.pathname.match(/^\/ipfs\/([^/]+)(\/.*)?$/);
      cid = path?.[1];
      rest = path?.[2] ?? "";
    }
  }
  if (!cid || !CID.test(cid)) return null;
  return `${MINTGARDEN_IPFS}${cid}${rest.replace(/\/$/, "")}`;
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
