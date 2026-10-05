/**
 * What MintGarden adds to a handle: the name NFT's artwork and nft1 id, which XCHandles does not
 * carry, and the only reverse direction either provider offers — the handle an address holds.
 * Purely decorative next to src/shared/lib/handles/xchandles.ts, which stays the authority: a
 * miss here costs a thumbnail, never the resolution itself.
 */

import { MINTGARDEN_API, type FetchLike } from "@/shared/lib/nft/mintgarden";

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export interface HandleArt {
  /** The name NFT as nft1…, for linking to its page. */
  nftId: string | null;
  /** The address MintGarden shows as holding the name NFT. */
  address: string | null;
  thumbnailUrl: string | null;
}

/** The name NFT behind a handle, as MintGarden has it indexed. */
export async function fetchHandleArt(
  handle: string,
  fetchImpl: FetchLike = fetch
): Promise<HandleArt | null> {
  try {
    const response = await fetchImpl(`${MINTGARDEN_API}/xchandles/${encodeURIComponent(handle)}`);
    if (!response.ok) return null;
    const nft = obj(obj(await response.json()).nft);
    const nftId = str(nft.encoded_id);
    if (!nftId) return null;
    return {
      nftId,
      address: str(nft.encoded_address),
      thumbnailUrl: str(nft.thumbnail_uri),
    };
  } catch {
    return null;
  }
}

export interface AddressHandle {
  handle: string;
  /** How many handles resolve to this address; the record names only the first. */
  count: number;
}

/**
 * The handle that resolves to an address, for the address page. MintGarden reports it on the
 * address record; the registry itself has no reverse index, so there is nowhere else to ask.
 */
export async function fetchAddressHandle(
  puzzleHash: string,
  fetchImpl: FetchLike = fetch
): Promise<AddressHandle | null> {
  const id = puzzleHash.trim().toLowerCase().replace(/^0x/, "");
  if (!id) return null;
  try {
    const response = await fetchImpl(`${MINTGARDEN_API}/address/${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    const r = obj(await response.json());
    // An address mid-sync reports no handle rather than a stale one.
    if (r.xchandles_registry_syncing === true) return null;
    const handle = str(r.xchandle);
    return handle ? { handle, count: num(r.xchandle_count) ?? 1 } : null;
  } catch {
    return null;
  }
}
