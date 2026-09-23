/**
 * NFT metadata from MintGarden. Verified 2026-09-15: https://api.mintgarden.io/nfts/<nft1 id>
 * answers with `access-control-allow-origin: *`; images come from assets.mainnet.mintgarden.io,
 * ipfs.mintgarden.io and the NFT's own data URIs. Those hosts must be on the Sage whitelist
 * (img-src). Everything here is best effort: the page works without it.
 */
import { MINTGARDEN_API, loadNftRecord } from "@/shared/lib/nft/mintgarden";
import { classifyNft, type Sensitivity } from "@/shared/lib/nft/sensitivity";
import { isTrustedVideoUrl, mintGardenIpfsUrl } from "@/shared/lib/trustedImage";

export { MINTGARDEN_API };

export interface NftMetadata {
  name: string | null;
  description: string | null;
  collectionName: string | null;
  collectionId: string | null;
  /** Preferred image (thumbnail first for speed), then full-size candidates. */
  imageUrls: string[];
  /** The artwork itself when it is a video; the images above are then its poster frame. */
  videoUrl: string | null;
  ownerP2: string | null;
  creatorP2: string | null;
  royaltyBasisPoints: number | null;
  metadataUris: string[];
  dataUris: string[];
  /** MintGarden's moderation verdict, from this same record: see lib/nft/sensitivity.ts. */
  sensitivity: Sensitivity;
}

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const arr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const hex = (v: unknown): string | null => {
  const s = str(v);
  return s ? s.toLowerCase().replace(/^0x/, "") : null;
};

export function normaliseMintGardenNft(raw: unknown): NftMetadata {
  const r = obj(raw);
  const data = obj(r.data);
  const meta = obj(data.metadata_json);
  const collection = obj(meta.collection);
  const owner = obj(r.owner_address);
  const creator = obj(r.creator_address);
  const candidates = [
    str(data.thumbnail_uri),
    str(data.preview_uri),
    ...arr(data.data_uris),
  ].filter((u): u is string => !!u && /^https?:\/\//.test(u));
  // A video data_uri is the artwork, not an image candidate: <img> would only fail on it. The
  // extension decides first; a data_uri without one is a video when the record's data_type says
  // so (TASK-097), which never applies to the thumbnail or preview, both stills. A data_uri on
  // an IPFS gateway this app does not trust is played from MintGarden's gateway instead: same
  // CID, same bytes, a trusted host.
  const dataUris = arr(data.data_uris);
  const videoSources = dataUris.flatMap((source): { source: string; url: string }[] => {
    const onMintGarden = mintGardenIpfsUrl(source);
    return onMintGarden && onMintGarden !== source
      ? [
          { source, url: source },
          { source, url: onMintGarden },
        ]
      : [{ source, url: source }];
  });
  const video =
    videoSources.find(({ url }) => isTrustedVideoUrl(url)) ??
    videoSources.find(({ url }) => isTrustedVideoUrl(url, data.data_type)) ??
    null;
  const videoUrl = video?.url ?? null;
  const images = candidates.filter((u) => u !== videoUrl && u !== video?.source);
  const description =
    collection.attributes && Array.isArray(collection.attributes)
      ? ((collection.attributes.map(obj).find((a) => a.type === "description")?.value as
          string | undefined) ?? null)
      : null;
  const royalty = r.royalty_percentage;
  return {
    name: str(meta.name) ?? str(r.name),
    description: str(meta.description) ?? description,
    collectionName: str(collection.name) ?? str(obj(r.collection).name),
    collectionId: str(collection.id) ?? str(obj(r.collection).id),
    imageUrls: [...new Set(images)],
    videoUrl,
    ownerP2: hex(owner.id),
    creatorP2: hex(creator.id),
    royaltyBasisPoints: typeof royalty === "number" ? Math.round(royalty) : null,
    metadataUris: arr(data.metadata_uris),
    dataUris,
    sensitivity: classifyNft(r),
  };
}

export async function fetchNftMetadata(
  nftId: string,
  fetchImpl?: typeof fetch
): Promise<NftMetadata | null> {
  // Shared with the icon fallback: one request per NFT, however many components show it.
  const record = await loadNftRecord(nftId, fetchImpl && ((url) => fetchImpl(url)));
  try {
    return record === null ? null : normaliseMintGardenNft(record);
  } catch {
    return null;
  }
}
