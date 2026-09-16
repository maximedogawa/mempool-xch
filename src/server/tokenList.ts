/**
 * Server-side token registry (TASK-031): fetches the Spacescan CAT token list once per TTL and
 * serves the normalised map to every client, so browsers never hit Spacescan's rate limit.
 * On upstream failure the last good map keeps being served (stale-on-error).
 */
import { normaliseTokenList, TOKEN_LIST_URL, type TokenMap } from "@/shared/api/tokenList";

export const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;
/** Retry an upstream failure no sooner than this. */
const RETRY_MS = 5 * 60 * 1000;

export interface TokenRegistryDeps {
  fetchImpl?: (url: string) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>;
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
        const response = await fetchImpl(TOKEN_LIST_URL);
        this.stats.upstreamFetches += 1;
        if (!response.ok) {
          this.stats.failures += 1;
          this.lastFailureAt = this.now();
          throw new Error(`Spacescan token list answered ${response.status}`);
        }
        const map = normaliseTokenList(JSON.parse(await response.text()));
        if (Object.keys(map).length === 0) {
          this.stats.failures += 1;
          this.lastFailureAt = this.now();
          throw new Error("Spacescan token list was empty");
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
