import { MINTGARDEN_API } from "@/shared/lib/nft/mintgarden";
import { classifySearchNft, type Sensitivity } from "@/shared/lib/nft/sensitivity";

export const ADDRESS_NFT_PAGE_SIZE = 20;
export interface AddressNft {
  id: string;
  name: string;
  collectionId: string | null;
  collectionName: string | null;
  thumbnailUrl: string | null;
  sensitivity: Sensitivity;
}
export interface AddressNftPage {
  items: AddressNft[];
  next: string | null;
}

/**
 * Who the NFTs belong to: a puzzle hash, or the launcher id of a DID. MintGarden indexes both
 * under the same paged shape, an address under /address and a DID under /profile, so the gallery
 * only has to know which index to ask.
 */
export type NftOwner = { kind: "address"; id: string } | { kind: "did"; id: string };

function ownerPath(owner: NftOwner): string {
  const base = owner.kind === "did" ? "profile" : "address";
  return `${base}/${encodeURIComponent(owner.id)}/nfts`;
}

/** MintGarden's owner index paginates without fetching coin records or individual metadata. */
export async function fetchAddressNfts(
  owner: NftOwner,
  cursor: string | null,
  collection: string,
  signal: AbortSignal
): Promise<AddressNftPage> {
  const params = new URLSearchParams({ type: "owned", size: String(ADDRESS_NFT_PAGE_SIZE) });
  if (cursor) params.set("page", cursor);
  if (collection) params.set("collection_id", collection);
  const response = await fetch(`${MINTGARDEN_API}/${ownerPath(owner)}?${params}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
  });
  if (!response.ok) throw new Error(`NFT provider answered HTTP ${response.status}.`);
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || !("items" in body) || !Array.isArray(body.items))
    throw new Error("The NFT provider returned an invalid page.");
  const text = (v: unknown) => (typeof v === "string" && v ? v : null);
  const items = body.items.slice(0, ADDRESS_NFT_PAGE_SIZE).flatMap((raw: unknown): AddressNft[] => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Record<string, unknown>;
    const id = text(item.encoded_id);
    if (!id) return [];
    return [
      {
        id,
        name: text(item.name) ?? id,
        collectionId: text(item.collection_id),
        collectionName: text(item.collection_name),
        thumbnailUrl: text(item.thumbnail_uri),
        sensitivity: classifySearchNft(item),
      },
    ];
  });
  return { items, next: "next" in body ? text(body.next) : null };
}
