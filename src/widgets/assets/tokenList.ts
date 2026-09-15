/**
 * CAT token metadata (name, ticker, icon) from the Spacescan token list. Verified 2026-09-15:
 * https://api.spacescan.io/tokens answers with `access-control-allow-origin: *` (icons live on
 * https://assets.spacescan.io). Both hosts must be on the Sage network whitelist. The endpoint
 * is rate limited, so the list is fetched once per session and cached in localStorage for a day.
 */
export const TOKEN_LIST_URL = "https://api.spacescan.io/tokens";
export const TOKEN_LIST_CACHE_KEY = "mempool-xch:tokens:v1";
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

interface SpacescanToken {
  asset_id?: string;
  name?: string;
  symbol?: string;
  preview_url?: string;
  website?: string;
  description?: string;
}

export function normaliseTokenList(raw: unknown): TokenMap {
  const cats = raw && typeof raw === "object" && Array.isArray((raw as { cats?: unknown }).cats) ? ((raw as { cats: SpacescanToken[] }).cats ?? []) : [];
  const map: TokenMap = {};
  cats.forEach((t) => {
    const assetId = typeof t.asset_id === "string" ? t.asset_id.toLowerCase().replace(/^0x/, "") : "";
    if (assetId.length !== 64) return;
    map[assetId] = {
      assetId,
      name: typeof t.name === "string" && t.name.trim() ? t.name.trim() : "Unknown token",
      symbol: typeof t.symbol === "string" && t.symbol.trim() ? t.symbol.trim().toUpperCase() : "CAT",
      iconUrl: typeof t.preview_url === "string" && /^https:\/\//.test(t.preview_url) ? t.preview_url : null,
      website: typeof t.website === "string" && /^https?:\/\//.test(t.website) ? t.website : null,
      description: typeof t.description === "string" && t.description.trim() ? t.description.trim() : null,
    };
  });
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
    inflight = fetchImpl(TOKEN_LIST_URL)
      .then(async (response) => {
        if (!response.ok) throw new Error(`token list ${response.status}`);
        const tokens = normaliseTokenList(await response.json());
        if (Object.keys(tokens).length > 0) writeTokenCache(storage, tokens);
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
