import registry from "./registry.json";

/**
 * Pool names. Only entries with a verifiable source belong in registry.json, so an
 * unknown address stays unnamed rather than being guessed.
 *
 * A Chia pool never signs a block; the farmer does. Under the official pool protocol each farmer
 * owns a PlotNFT, and a block's pool_puzzle_hash is that PlotNFT's own p2_singleton address, unique
 * per farmer. The pool only shows up later, when it claims the 7/8 reward from that address to the
 * target_puzzle_hash it publishes at /pool_info. So a pool is identified by two kinds of hash:
 *
 * - `claimTargets`: the pool's /pool_info target_puzzle_hash. Matched against where a payout
 *   address's rewards are claimed to (claims.ts), never against a block's pool_puzzle_hash.
 * - `payoutAddresses`: fixed addresses that appear directly as a block's pool_puzzle_hash. Only
 *   operators outside the official protocol have these (NoSSD, H9's and Spacefarmers' "both
 *   shares" addresses, where pool_puzzle_hash equals farmer_puzzle_hash on every block).
 */
export interface PoolEntry {
  name: string;
  url: string;
  /** Where the hashes were confirmed. */
  source: string;
  claimTargets: string[];
  payoutAddresses: string[];
}

const entries = registry.pools as PoolEntry[];

const byHash = new Map<string, PoolEntry>(
  entries.flatMap((pool) =>
    [...pool.claimTargets, ...pool.payoutAddresses].map((hash) => [normalise(hash), pool] as const)
  )
);

function normalise(hash: string): string {
  return hash.toLowerCase().replace(/^0x/, "");
}

/** Looks a pool up by either kind of hash: a block's payout puzzle hash or a claim target. */
export function lookupPool(puzzleHash: string): PoolEntry | null {
  return byHash.get(normalise(puzzleHash)) ?? null;
}
