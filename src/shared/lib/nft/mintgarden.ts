/**
 * NFT section data (TASK-066): MintGarden's public API for collections and activity, verified
 * 2026-09-17 against https://api.mintgarden.io/openapi.json (47 documented endpoints, CORS open).
 * Everything here is best effort and mainnet only, same as nftMetadata.ts; a failed fetch returns
 * an empty result rather than throwing, so a page degrades instead of breaking.
 */

export const MINTGARDEN_API = "https://api.mintgarden.io";
export const DEXIE_API = "https://api.dexie.space/v1";

export interface MinimalResponse {
  ok: boolean;
  json: () => Promise<unknown>;
}
export type FetchLike = (url: string) => Promise<MinimalResponse>;

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const hex = (v: unknown): string | null => {
  const s = str(v);
  return s ? s.toLowerCase().replace(/^0x/, "") : null;
};

export interface NftCollectionSummary {
  id: string;
  name: string | null;
  thumbnailUrl: string | null;
  creatorName: string | null;
  volumeXch: number | null;
  floorPriceXch: number | null;
  nftCount: number | null;
  tradeCount: number | null;
}

function normaliseCollection(raw: unknown): NftCollectionSummary {
  const r = obj(raw);
  const creator = obj(r.creator);
  return {
    id: str(r.id) ?? "",
    name: str(r.name),
    thumbnailUrl: str(r.thumbnail_uri),
    creatorName: str(creator.name) ?? str(creator.username),
    volumeXch: num(r.volume),
    floorPriceXch: num(r.floor_price),
    nftCount: num(r.nft_count),
    tradeCount: num(r.trade_count),
  };
}

export interface NftCollectionsPage {
  collections: NftCollectionSummary[];
  next: string | null;
}

export type CollectionInterval = "1" | "7" | "30" | "all";

/** Collections sorted by volume within `interval` days ("all" for all time). */
export async function fetchCollections(
  opts: { interval?: CollectionInterval; page?: string; size?: number; search?: string } = {},
  fetchImpl: FetchLike = fetch
): Promise<NftCollectionsPage> {
  const params = new URLSearchParams({
    interval: opts.interval ?? "30",
    size: String(opts.size ?? 20),
    include_floor_price: "true",
  });
  if (opts.page) params.set("page", opts.page);
  if (opts.search) params.set("search", opts.search);
  try {
    const response = await fetchImpl(`${MINTGARDEN_API}/collections?${params}`);
    if (!response.ok) return { collections: [], next: null };
    const body = obj(await response.json());
    const items = Array.isArray(body.items) ? body.items : [];
    return { collections: items.map(normaliseCollection), next: str(body.next) };
  } catch {
    return { collections: [], next: null };
  }
}

export type NftEventKind = "mint" | "transfer" | "trade" | "burn";
const EVENT_TYPE_TO_KIND: Record<number, NftEventKind> = { 0: "mint", 1: "transfer", 2: "trade", 3: "burn" };
const KIND_TO_EVENT_TYPE: Record<NftEventKind, number> = { mint: 0, transfer: 1, trade: 2, burn: 3 };

export interface NftEvent {
  nftId: string;
  nftName: string | null;
  thumbnailUrl: string | null;
  collectionId: string | null;
  collectionName: string | null;
  kind: NftEventKind;
  timestamp: number | null;
  blockHeight: number | null;
  xchPrice: number | null;
  ownerAddress: string | null;
}

function normaliseEvent(raw: unknown): NftEvent | null {
  const r = obj(raw);
  const nftId = hex(r.nft_id);
  if (!nftId) return null;
  const nft = obj(r.nft);
  const data = obj(nft.data);
  const collection = obj(obj(r.nft).collection ?? {});
  const address = obj(r.address);
  const type = typeof r.type === "number" ? r.type : Number(r.type);
  const timestamp = str(r.timestamp);
  return {
    nftId,
    nftName: str(data.name) ?? str(nft.encoded_id),
    thumbnailUrl: str(data.thumbnail_uri),
    collectionId: str(collection.id),
    collectionName: str(collection.name),
    kind: EVENT_TYPE_TO_KIND[type] ?? "transfer",
    timestamp: timestamp ? Date.parse(timestamp) : null,
    blockHeight: num(r.block_height),
    xchPrice: num(r.xch_price),
    ownerAddress: str(address.encoded_id),
  };
}

export interface NftEventsPage {
  events: NftEvent[];
  next: string | null;
}

/** Global NFT activity feed, optionally filtered by kind (mint/transfer/trade/burn). */
export async function fetchNftEvents(
  opts: { kinds?: NftEventKind[]; page?: string; size?: number; collectionId?: string } = {},
  fetchImpl: FetchLike = fetch
): Promise<NftEventsPage> {
  const params = new URLSearchParams({ size: String(opts.size ?? 25) });
  if (opts.page) params.set("page", opts.page);
  if (opts.collectionId) params.set("collection", opts.collectionId);
  opts.kinds?.forEach((k) => params.append("type", String(KIND_TO_EVENT_TYPE[k])));
  try {
    const response = await fetchImpl(`${MINTGARDEN_API}/events?${params}`);
    if (!response.ok) return { events: [], next: null };
    const body = obj(await response.json());
    const items = Array.isArray(body.items) ? body.items : [];
    return { events: items.map(normaliseEvent).filter((e): e is NftEvent => e !== null), next: str(body.next) };
  } catch {
    return { events: [], next: null };
  }
}

export interface NftOffer {
  id: string;
  offerFile: string;
  priceXch: number | null;
  requested: { code: string; amount: number }[];
  dateFound: number | null;
  dateExpiry: number | null;
}

function normaliseOffer(raw: unknown): NftOffer {
  const r = obj(raw);
  const requested = Array.isArray(r.requested) ? r.requested : [];
  const dateFound = str(r.date_found);
  const dateExpiry = str(r.date_expiry);
  return {
    id: str(r.id) ?? "",
    offerFile: str(r.offer) ?? "",
    priceXch: num(r.price),
    requested: requested.map(obj).map((a) => ({ code: str(a.code) ?? str(a.id) ?? "?", amount: num(a.amount) ?? 0 })),
    dateFound: dateFound ? Date.parse(dateFound) : null,
    dateExpiry: dateExpiry ? Date.parse(dateExpiry) : null,
  };
}

/** Open (status 0 = active) sell offers for `nftId`, cheapest first — Dexie is the offer index (decision-012 approved provider). */
export async function fetchNftOffers(nftId: string, fetchImpl: FetchLike = fetch): Promise<NftOffer[]> {
  try {
    const response = await fetchImpl(`${DEXIE_API}/offers?offered=${encodeURIComponent(nftId)}&status=0&page_size=20`);
    if (!response.ok) return [];
    const body = obj(await response.json());
    const offers = Array.isArray(body.offers) ? body.offers : [];
    return offers.map(normaliseOffer).sort((a, b) => (a.priceXch ?? Infinity) - (b.priceXch ?? Infinity));
  } catch {
    return [];
  }
}
