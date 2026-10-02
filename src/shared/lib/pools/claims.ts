import type { TxSummary } from "@/shared/lib/rpc/types";

/**
 * Which pool a payout address belongs to. Under the official pool protocol a block's
 * pool_puzzle_hash is the farmer's own PlotNFT address (p2_singleton), so it says nothing about
 * the pool. The pool appears when the reward is claimed: the PlotNFT singleton is spent together
 * with the reward coin and pays it to the pool's target puzzle hash (or, for a self-pooling
 * PlotNFT, to the farmer's own wallet). Coinset's indexed transactions expose exactly that spend.
 */
export interface PoolClaim {
  /** Where the address's rewards are claimed to; null when its latest spend is not a PlotNFT claim. */
  target: string | null;
  /** The PlotNFT was self-pooling (or leaving its pool) at that claim: the farmer claimed for themselves. */
  selfPooled: boolean;
}

const NO_CLAIM: PoolClaim = { target: null, selfPooled: false };

/**
 * Every PlotNFT claim in a transaction, keyed by payout puzzle hash. Pools batch many farmers'
 * claims into one spend bundle, so one transaction usually answers for several addresses.
 * A claim only counts when the reward's destination is unambiguous within its event.
 */
export function claimsFromTransaction(tx: TxSummary): Map<string, PoolClaim> {
  const claims = new Map<string, PoolClaim>();
  for (const event of tx.events) {
    const singletons = event.inputs.filter((i) => i.outerPuzzleType === "Singleton");
    const selfPooled =
      singletons.length > 0 && singletons.every((s) => s.custodyPuzzleType === "PoolWaitingRoom");
    for (const input of event.inputs) {
      if (!input.custodyPuzzleType?.startsWith("P2Singleton") || claims.has(input.puzzleHash))
        continue;
      const targets = new Set(
        event.outputs
          .filter((o) => o.amount === input.amount && o.outerPuzzleType !== "Singleton")
          .map((o) => o.puzzleHash)
      );
      if (targets.size !== 1) continue;
      claims.set(input.puzzleHash, { target: [...targets][0]!, selfPooled });
    }
  }
  return claims;
}

export interface ResolveClaimsOptions {
  /** Payout puzzle hashes still to resolve, most important first. */
  payouts: readonly string[];
  /** The latest confirmed transaction touching an address, or null when it has none. */
  fetchLatestTransaction: (payout: string, signal: AbortSignal) => Promise<TxSummary | null>;
  /** Called after each lookup with everything it settled, including bystanders in a batched claim. */
  onResolved: (claims: Map<string, PoolClaim>) => void;
  /** Called when a lookup fails; the address stays unresolved and is retried on the next visit. */
  onFailed?: (payout: string) => void;
  signal: AbortSignal;
  concurrency?: number;
  /** A failed lookup is retried once after this pause; Coinset answers bursts with errors. */
  retryDelayMs?: number;
}

/**
 * Resolves payout addresses to their claim targets, one indexed lookup per address at most.
 * Addresses settled as bystanders of an earlier lookup are skipped, which is what keeps a window
 * of several hundred PlotNFT farmers to a few hundred small requests.
 */
export async function resolveClaims(options: ResolveClaimsOptions): Promise<void> {
  const {
    payouts,
    fetchLatestTransaction,
    onResolved,
    onFailed,
    signal,
    concurrency = 4,
    retryDelayMs = 1500,
  } = options;
  const settled = new Set<string>();
  let next = 0;

  const fetchWithRetry = async (payout: string) => {
    try {
      return await fetchLatestTransaction(payout, signal);
    } catch (error) {
      if (signal.aborted) throw error;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      return fetchLatestTransaction(payout, signal);
    }
  };

  const worker = async () => {
    while (next < payouts.length && !signal.aborted) {
      const payout = payouts[next++]!;
      if (settled.has(payout)) continue;
      try {
        const tx = await fetchWithRetry(payout);
        if (signal.aborted) return;
        const claims = tx ? claimsFromTransaction(tx) : new Map<string, PoolClaim>();
        if (!claims.has(payout)) claims.set(payout, NO_CLAIM);
        for (const hash of claims.keys()) settled.add(hash);
        onResolved(claims);
      } catch {
        if (signal.aborted) return;
        onFailed?.(payout);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(concurrency, payouts.length) }, worker));
}
