/**
 * CAT token metadata (name, ticker, icon) from Dexie. Verified 2026-09-16:
 * https://api.dexie.space/v1/assets?type=cat answers with `access-control-allow-origin: *`,
 * 100 assets per page (943 CATs on mainnet), and icons live at
 * https://icons.dexie.space/<asset_id>.webp — a deterministic URL per asset id (404 when Dexie
 * has none), so an icon can be shown even for a CAT that is not on the list. Spacescan was
 * dropped the same day: its list rate-limits (429) and its icon CDN refuses direct requests
 * (403), which is what an installed Sage app sees. Both Dexie hosts are on the Sage whitelist.
 */
export const DEXIE_ASSETS_URL = "https://api.dexie.space/v1/assets";
export const DEXIE_ICON_BASE = "https://icons.dexie.space";
export const DEXIE_PAGE_SIZE = 100;
/** Hard stop for the page loop (943 CATs ≈ 10 pages in 2026). */
export const DEXIE_MAX_PAGES = 40;
export const TOKEN_LIST_CACHE_KEY = "mempool-xch:tokens:v2";
export const TOKEN_LIST_TTL_MS = 24 * 60 * 60 * 1000;

export interface TokenInfo {
  assetId: string;
  name: string;
  symbol: string;
  iconUrl: string | null;
  website: string | null;
  description: string | null;
}

export type TokenMap = Record<string, TokenInfo>;

interface DexieAsset {
  id?: string;
  code?: string;
  name?: string;
  denom?: number;
  website?: string;
  description?: string;
}

interface DexiePage {
  success?: boolean;
  count?: number;
  page?: number;
  page_size?: number;
  assets?: DexieAsset[];
}

/** Dexie's icon for an asset id; exists for every listed CAT and for many unlisted ones. */
export function dexieIconUrl(assetId: string): string {
  return `${DEXIE_ICON_BASE}/${assetId.toLowerCase().replace(/^0x/, "")}.webp`;
}

export function dexiePageUrl(page: number): string {
  return `${DEXIE_ASSETS_URL}?type=cat&page_size=${DEXIE_PAGE_SIZE}&page=${page}`;
}

/** Normalise one Dexie page (or a bare `assets` array) into the registry map. */
export function normaliseTokenList(raw: unknown): TokenMap {
  const assets: DexieAsset[] = Array.isArray(raw) ? (raw as DexieAsset[]) : raw && typeof raw === "object" && Array.isArray((raw as DexiePage).assets) ? ((raw as DexiePage).assets ?? []) : [];
  const map: TokenMap = {};
  assets.forEach((t) => {
    const assetId = typeof t.id === "string" ? t.id.toLowerCase().replace(/^0x/, "") : "";
    if (!/^[0-9a-f]{64}$/.test(assetId)) return;
    map[assetId] = {
      assetId,
      name: typeof t.name === "string" && t.name.trim() ? t.name.trim() : "Unknown token",
      symbol: typeof t.code === "string" && t.code.trim() ? t.code.trim().toUpperCase() : "CAT",
      iconUrl: dexieIconUrl(assetId),
      website: typeof t.website === "string" && /^https?:\/\//.test(t.website) ? t.website : null,
      description: typeof t.description === "string" && t.description.trim() ? t.description.trim() : null,
    };
  });
  return map;
}

export interface MinimalResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

/** Fetch every Dexie CAT page and merge; throws when the first page fails or is empty. */
export async function fetchDexieTokenMap(fetchImpl: (url: string) => Promise<MinimalResponse>): Promise<TokenMap> {
  const map: TokenMap = {};
  for (let page = 1; page <= DEXIE_MAX_PAGES; page += 1) {
    const response = await fetchImpl(dexiePageUrl(page));
    if (!response.ok) throw new Error(`Dexie assets answered ${response.status}`);
    const body = JSON.parse(await response.text()) as DexiePage;
    Object.assign(map, normaliseTokenList(body));
    const size = body.page_size ?? DEXIE_PAGE_SIZE;
    const count = body.count ?? 0;
    if ((body.assets?.length ?? 0) < size || page * size >= count) break;
  }
  if (Object.keys(map).length === 0) throw new Error("Dexie asset list was empty");
  return map;
}

interface CacheEntry {
  savedAt: number;
  tokens: TokenMap;
}

export function readTokenCache(storage: Pick<Storage, "getItem"> | null, now = Date.now()): TokenMap | null {
  try {
    const raw = storage?.getItem(TOKEN_LIST_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry;
    if (!entry || typeof entry.savedAt !== "number" || !entry.tokens || now - entry.savedAt > TOKEN_LIST_TTL_MS) return null;
    return entry.tokens;
  } catch {
    return null;
  }
}

export function writeTokenCache(storage: Pick<Storage, "setItem"> | null, tokens: TokenMap, now = Date.now()): void {
  try {
    storage?.setItem(TOKEN_LIST_CACHE_KEY, JSON.stringify({ savedAt: now, tokens } satisfies CacheEntry));
  } catch {
    // Quota exceeded or storage unavailable: the in-memory copy still serves this session.
  }
}

let inflight: Promise<TokenMap> | null = null;

/** Fetch the token list once per session (deduplicated), falling back to the cache and then to {}. */
export function loadTokenList(fetchImpl: typeof fetch = fetch, storage: Storage | null = typeof window !== "undefined" ? window.localStorage : null): Promise<TokenMap> {
  const cached = readTokenCache(storage);
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetchDexieTokenMap((url) => fetchImpl(url, { headers: { accept: "application/json" } }))
      .then((tokens) => {
        writeTokenCache(storage, tokens);
        return tokens;
      })
      .catch(() => ({}) as TokenMap)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function tokenLabel(token: TokenInfo | undefined, assetId: string): string {
  return token ? `${token.name} (${token.symbol})` : `CAT ${assetId.slice(0, 8)}…`;
}
