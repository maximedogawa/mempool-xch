/**
 * NFT section data: MintGarden's public API for collections and activity, verified
 * 2026-09-17 against https://api.mintgarden.io/openapi.json (47 documented endpoints, CORS open).
 * Everything here is best effort and mainnet only, same as nftMetadata.ts; a failed fetch returns
 * an empty result rather than throwing, so a page degrades instead of breaking.
 */

import { createLimiter } from "@/shared/lib/limit";
import {
  UNCLASSIFIED,
  classifyCollection,
  classifyNft,
  classifySearchNft,
  type Sensitivity,
} from "./sensitivity";

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

/** MintGarden calls in flight per tab, across every badge, goggle and NFT page. */
const mintGardenLimit = createLimiter(4);
const NFT_RECORD_TTL_MS = 5 * 60_000;
const nftRecords = new Map<string, { at: number; record: Promise<unknown> }>();

/**
 * The raw /nfts/<id> record, or null when MintGarden does not know the NFT. Asked once per NFT
 * for all callers (icon fallback, goggles, NFT page), misses included: an NFT that is not
 * indexed would otherwise cost one 404 per component showing it. An injected fetch bypasses the
 * shared memo.
 */
export function loadNftRecord(nftId: string, fetchImpl?: FetchLike): Promise<unknown> {
  const load = async (doFetch: FetchLike): Promise<unknown> => {
    try {
      const response = await doFetch(`${MINTGARDEN_API}/nfts/${encodeURIComponent(nftId)}`);
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  };
  if (fetchImpl) return load(fetchImpl);
  const known = nftRecords.get(nftId);
  if (known && Date.now() - known.at < NFT_RECORD_TTL_MS) return known.record;
  const record = mintGardenLimit(() => load((url) => fetch(url)));
  nftRecords.set(nftId, { at: Date.now(), record });
  if (nftRecords.size > 500) nftRecords.delete(nftRecords.keys().next().value!);
  return record;
}

export interface NftCollectionSummary {
  id: string;
  name: string | null;
  thumbnailUrl: string | null;
  creatorName: string | null;
  volumeXch: number | null;
  floorPriceXch: number | null;
  nftCount: number | null;
  tradeCount: number | null;
  sensitivity: Sensitivity;
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
    sensitivity: classifyCollection(r),
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
const EVENT_TYPE_TO_KIND: Record<number, NftEventKind> = {
  0: "mint",
  1: "transfer",
  2: "trade",
  3: "burn",
};
const KIND_TO_EVENT_TYPE: Record<NftEventKind, number> = {
  mint: 0,
  transfer: 1,
  trade: 2,
  burn: 3,
};

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
  sensitivity: Sensitivity;
}

function normaliseEvent(raw: unknown): NftEvent | null {
  const r = obj(raw);
  const nftId = hex(r.nft_id);
  if (!nftId) return null;
  const nft = obj(r.nft);
  const data = obj(nft.data);
  // The events payload carries the collection at the top level, not inside `nft`; reading it
  // from `nft` left the name and the moderation flags empty on every row.
  const collection = obj(r.collection ?? nft.collection);
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
    sensitivity: classifyNft(nft, collection, r.creator),
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
    return {
      events: items.map(normaliseEvent).filter((e): e is NftEvent => e !== null),
      next: str(body.next),
    };
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
    requested: requested
      .map(obj)
      .map((a) => ({ code: str(a.code) ?? str(a.id) ?? "?", amount: num(a.amount) ?? 0 })),
    dateFound: dateFound ? Date.parse(dateFound) : null,
    dateExpiry: dateExpiry ? Date.parse(dateExpiry) : null,
  };
}

/** Outbound links. Ids come from the APIs' responses, so they are encoded rather than trusted as a path. */
export function mintGardenCollectionUrl(collectionId: string): string {
  return `https://mintgarden.io/collections/${encodeURIComponent(collectionId)}`;
}

export function mintGardenProfileUrl(didId: string): string {
  return `https://mintgarden.io/${encodeURIComponent(didId)}`;
}

export function dexieOfferUrl(offerId: string): string {
  return `https://dexie.space/offers/${encodeURIComponent(offerId)}`;
}

/** Direct thumbnail URL: verified 2026-09-16 to 307-redirect straight to assets.mainnet.mintgarden.io, one request, no JSON parsing needed. `nftId` is the nft1… bech32 id. */
export function mintGardenThumbnailUrl(nftId: string): string {
  return `${MINTGARDEN_API}/nfts/${encodeURIComponent(nftId)}/thumbnail`;
}

/** Fallback when the thumbnail redirect 404s (NFT not indexed by MintGarden): the full record's own image candidates. */
export async function fetchNftImageUrls(nftId: string, fetchImpl?: FetchLike): Promise<string[]> {
  const data = obj(obj(await loadNftRecord(nftId, fetchImpl)).data);
  return [str(data.thumbnail_uri), str(data.preview_uri)].filter((u): u is string => !!u);
}

/** Open (status 0 = active) sell offers for `nftId`, cheapest first — Dexie is the offer index. */
export async function fetchNftOffers(
  nftId: string,
  fetchImpl: FetchLike = fetch
): Promise<NftOffer[]> {
  try {
    const response = await fetchImpl(
      `${DEXIE_API}/offers?offered=${encodeURIComponent(nftId)}&status=0&page_size=20`
    );
    if (!response.ok) return [];
    const body = obj(await response.json());
    const offers = Array.isArray(body.offers) ? body.offers : [];
    return offers
      .map(normaliseOffer)
      .sort((a, b) => (a.priceXch ?? Infinity) - (b.priceXch ?? Infinity));
  } catch {
    return [];
  }
}

export interface NftSearchResult {
  nftId: string;
  name: string | null;
  thumbnailUrl: string | null;
  sensitivity: Sensitivity;
}

export interface CollectionSearchResult {
  id: string;
  name: string | null;
  thumbnailUrl: string | null;
  sensitivity: Sensitivity;
}

export interface NftSearchResults {
  nfts: NftSearchResult[];
  collections: CollectionSearchResult[];
}

const EMPTY_SEARCH: NftSearchResults = { nfts: [], collections: [] };

/**
 * Free-text search, verified 2026-09-17 against a live query: /search?query= returns
 * nfts, collections, profiles, addresses and xchandle matches for one query; only nfts and
 * collections are in scope here. A failed or rate-limited request degrades to no results, same
 * as every other function in this file, so the search box falls back to its "not recognised"
 * state rather than showing an error for what is an additive, best-effort lookup.
 */
export async function searchMintGarden(
  query: string,
  fetchImpl: FetchLike = fetch
): Promise<NftSearchResults> {
  const trimmed = query.trim();
  if (!trimmed) return EMPTY_SEARCH;
  try {
    const response = await fetchImpl(
      `${MINTGARDEN_API}/search?query=${encodeURIComponent(trimmed)}`
    );
    if (!response.ok) return EMPTY_SEARCH;
    const body = obj(await response.json());
    const nfts = Array.isArray(body.nfts) ? body.nfts : [];
    const collections = Array.isArray(body.collections) ? body.collections : [];
    return {
      nfts: nfts
        .map(obj)
        .map((n) => ({
          nftId: str(n.encoded_id) ?? "",
          name: str(n.name),
          thumbnailUrl: str(n.thumbnail_uri),
          sensitivity: classifySearchNft(n),
        }))
        .filter((n) => n.nftId),
      collections: collections
        .map(obj)
        .map((c) => ({
          id: str(c.id) ?? "",
          name: str(c.name),
          thumbnailUrl: str(c.thumbnail_uri),
          // A collection hit carries no flags of its own (verified 2026-09-20), so it is never
          // shown on trust; the collection page, which has the record, judges it properly.
          sensitivity: UNCLASSIFIED,
        }))
        .filter((c) => c.id),
    };
  } catch {
    return EMPTY_SEARCH;
  }
}

export interface DidProfile {
  /** Launcher id, lowercase hex without 0x. */
  launcherId: string;
  didId: string | null;
  name: string | null;
  bio: string | null;
  website: string | null;
  twitterHandle: string | null;
  avatarUrl: string | null;
  /** Null when MintGarden was not asked for counts, or answered without them. */
  ownedNfts: number | null;
  createdNfts: number | null;
  verified: boolean;
}

export interface HeldCollection {
  id: string;
  name: string | null;
  thumbnailUrl: string | null;
  nftsOwned: number;
}

function normaliseProfile(raw: unknown): DidProfile | null {
  const r = obj(raw);
  const launcherId = hex(r.id);
  if (!launcherId) return null;
  return {
    launcherId,
    didId: str(r.encoded_id),
    name: str(r.name) ?? str(r.username),
    bio: str(r.bio),
    website: str(r.website),
    twitterHandle: str(r.twitter_handle),
    avatarUrl: str(r.avatar_uri),
    ownedNfts: num(r.owned_nfts_count),
    createdNfts: num(r.created_nfts_count),
    // The field is a number on the plain record and a string once counts are included.
    verified: Number(r.verification_state) > 0,
  };
}

/**
 * The MintGarden profile behind a DID: /profile/<launcher hex> answers for an unregistered DID
 * too, with every field empty, so a hit is not proof the owner ever used MintGarden. `counts`
 * asks for the owned/created totals, which cost an extra aggregation on their side; the
 * watchlist row wants them, an avatar lookup does not. Best effort like the rest of this file:
 * a miss is null, never a throw.
 */
export async function fetchDidProfile(
  launcherId: string,
  opts: { counts?: boolean } = {},
  fetchImpl: FetchLike = fetch
): Promise<DidProfile | null> {
  const id = hex(launcherId);
  if (!id) return null;
  try {
    const response = await fetchImpl(
      `${MINTGARDEN_API}/profile/${id}${opts.counts ? "?include_counts=true" : ""}`
    );
    if (!response.ok) return null;
    return normaliseProfile(await response.json());
  } catch {
    return null;
  }
}

/** Collections the DID holds NFTs from, biggest holding first. */
export async function fetchDidHeldCollections(
  launcherId: string,
  fetchImpl: FetchLike = fetch
): Promise<HeldCollection[]> {
  const id = hex(launcherId);
  if (!id) return [];
  try {
    const response = await fetchImpl(`${MINTGARDEN_API}/profile/${id}/held-collections`);
    if (!response.ok) return [];
    const body: unknown = await response.json();
    if (!Array.isArray(body)) return [];
    return body
      .map(obj)
      .map((c) => ({
        id: str(c.id) ?? "",
        name: str(c.name),
        thumbnailUrl: str(c.thumbnail_uri),
        nftsOwned: num(c.nfts_owned) ?? 0,
      }))
      .filter((c) => c.id)
      .sort((a, b) => b.nftsOwned - a.nftsOwned);
  } catch {
    return [];
  }
}
