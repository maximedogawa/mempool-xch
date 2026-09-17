import registry from "./registry.json";

/**
 * Pool names by payout puzzle hash (TASK-061 lookup; TASK-060 fills the registry). Only entries
 * with a verifiable source belong in registry.json, so an unknown payout address stays unnamed
 * rather than being guessed.
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
