/**
 * Server-side token registry (TASK-031, Dexie since TASK-041): fetches Dexie's CAT asset pages
 * once per TTL and serves the normalised map to every client, so browsers make one small
 * request instead of ten. On upstream failure the last good map keeps being served.
 */
import { fetchDexieTokenMap, type MinimalResponse, type TokenMap } from "@/shared/api/tokenList";

export const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
/** Retry an upstream failure no sooner than this. */
const RETRY_MS = 5 * 60 * 1000;

export interface TokenRegistryDeps {
  fetchImpl?: (url: string) => Promise<MinimalResponse>;
  now?: () => number;
  ttlMs?: number;
}

export class TokenRegistry {
  private tokens: TokenMap | null = null;
  private fetchedAt = 0;
  /** Time of the last failed upstream fetch; refreshes are held back for RETRY_MS after it. */
  private lastFailureAt = 0;
  private inflight: Promise<TokenMap> | null = null;
  readonly stats = { upstreamFetches: 0, failures: 0 };

  constructor(private readonly deps: TokenRegistryDeps = {}) {}

  private now(): number {
    return this.deps.now ? this.deps.now() : Date.now();
  }

  /** Current map (possibly stale) and whether a refresh is due. */
  async get(): Promise<{ tokens: TokenMap; fetchedAt: number; stale: boolean }> {
    const ttl = this.deps.ttlMs ?? TOKEN_TTL_MS;
    const fresh = this.tokens !== null && this.now() - this.fetchedAt < ttl;
    if (!fresh && this.now() - this.lastFailureAt >= RETRY_MS) {
      await this.refresh().catch(() => {
        // Keep serving the last good map; the next call after RETRY_MS tries again.
      });
    }
    return { tokens: this.tokens ?? {}, fetchedAt: this.fetchedAt, stale: this.tokens === null || this.now() - this.fetchedAt >= ttl };
  }

  refresh(): Promise<TokenMap> {
    if (!this.inflight) {
      const fetchImpl = this.deps.fetchImpl ?? ((url: string) => fetch(url, { headers: { accept: "application/json" } }));
      this.inflight = (async () => {
        this.stats.upstreamFetches += 1;
        let map: TokenMap;
        try {
          map = await fetchDexieTokenMap(fetchImpl);
        } catch (error) {
          this.stats.failures += 1;
          this.lastFailureAt = this.now();
          throw error;
        }
        this.tokens = map;
        this.fetchedAt = this.now();
        return map;
      })().finally(() => {
        this.inflight = null;
      });
    }
    return this.inflight;
  }
}

let registry: TokenRegistry | null = null;

export function getTokenRegistry(): TokenRegistry {
  if (!registry) registry = new TokenRegistry();
  return registry;
}
