/**
 * NFT metadata from MintGarden. Verified 2026-09-15: https://api.mintgarden.io/nfts/<nft1 id>
 * answers with `access-control-allow-origin: *`; images come from assets.mainnet.mintgarden.io,
 * ipfs.mintgarden.io and the NFT's own data URIs. Those hosts must be on the Sage whitelist
 * (img-src). Everything here is best effort: the page works without it.
 */
export const MINTGARDEN_API = "https://api.mintgarden.io";

export interface NftMetadata {
  name: string | null;
  description: string | null;
  collectionName: string | null;
  collectionId: string | null;
  /** Preferred image (thumbnail first for speed), then full-size candidates. */
  imageUrls: string[];
  ownerP2: string | null;
  creatorP2: string | null;
  royaltyBasisPoints: number | null;
  metadataUris: string[];
  dataUris: string[];
}

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
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
  const images = [str(data.thumbnail_uri), str(data.preview_uri), ...arr(data.data_uris)].filter((u): u is string => !!u && /^https?:\/\//.test(u));
  const description = collection.attributes && Array.isArray(collection.attributes)
    ? (collection.attributes.map(obj).find((a) => a.type === "description")?.value as string | undefined) ?? null
    : null;
  const royalty = r.royalty_percentage;
  return {
    name: str(meta.name) ?? str(r.name),
    description: str(meta.description) ?? description,
    collectionName: str(collection.name) ?? str(obj(r.collection).name),
    collectionId: str(collection.id) ?? str(obj(r.collection).id),
    imageUrls: [...new Set(images)],
    ownerP2: hex(owner.id),
    creatorP2: hex(creator.id),
    royaltyBasisPoints: typeof royalty === "number" ? Math.round(royalty) : null,
    metadataUris: arr(data.metadata_uris),
    dataUris: arr(data.data_uris),
  };
}

export async function fetchNftMetadata(nftId: string, fetchImpl: typeof fetch = fetch): Promise<NftMetadata | null> {
  try {
    const response = await fetchImpl(`${MINTGARDEN_API}/nfts/${encodeURIComponent(nftId)}`);
    if (!response.ok) return null;
    return normaliseMintGardenNft(await response.json());
  } catch {
    return null;
  }
}
