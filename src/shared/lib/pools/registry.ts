import registry from "./registry.json";

/**
 * Pool names by payout puzzle hash (TASK-061 lookup; TASK-060 fills the registry). Only entries
 * with a verifiable source belong in registry.json, so an unknown payout address stays unnamed
 * rather than being guessed.
 *
 * This can only ever name a fixed-address pool (pool_puzzle_hash is the same on every block it
 * farms — self-pooling, or a pool that also runs one, confirmed by pool_puzzle_hash ==
 * farmer_puzzle_hash on Coinset). It cannot name a farmer using the standard PlotNFT pooling
 * protocol (chia plotnft join): there, the 7/8 pool share goes to that farmer's own unique
 * p2_singleton address, not to a shared pool wallet, so a pool's /pool_info target_puzzle_hash
 * never appears as a block's pool_puzzle_hash directly. Naming those blocks would mean resolving
 * each farmer's singleton puzzle reveal on-chain to read out the pool URL — real, but separate,
 * future work; a static hash registry cannot do it.
 */
export interface PoolEntry {
  name: string;
  url: string;
  /** Where the payout address was confirmed. */
  source: string;
  puzzleHashes: string[];
}

const entries = registry.pools as PoolEntry[];

const byPuzzleHash = new Map<string, PoolEntry>(entries.flatMap((pool) => pool.puzzleHashes.map((hash) => [normalise(hash), pool] as const)));

function normalise(hash: string): string {
  return hash.toLowerCase().replace(/^0x/, "");
}

export function lookupPool(puzzleHash: string): PoolEntry | null {
  return byPuzzleHash.get(normalise(puzzleHash)) ?? null;
}
