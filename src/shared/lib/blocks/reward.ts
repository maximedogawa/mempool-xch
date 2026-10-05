import type { Mojos } from "@/shared/lib/chia/amounts";

/**
 * Block reward schedule (chia/consensus/block_rewards.py): the pool gets 7/8 and the farmer
 * 1/8 of the base reward, which halves every three years of blocks. Fees go to the farmer on
 * top. Height 0 carries the 21,000,000 XCH prefarm. The reward coins are paid out in the next
 * transaction block, not in the block that earned them.
 */
const MOJO_PER_XCH = 1_000_000_000_000n;
export const BLOCKS_PER_YEAR = 1_681_920;
const PREFARM = 21_000_000n * MOJO_PER_XCH;

/** Base reward (pool + farmer) in mojos for a block at `height`. */
function baseReward(height: number): Mojos {
  if (height === 0) return PREFARM;
  const period = Math.floor(height / (3 * BLOCKS_PER_YEAR));
  // 2, 1, 0.5, 0.25 XCH, then 0.125 XCH forever.
  const halvings = Math.min(period, 4);
  return (2n * MOJO_PER_XCH) >> BigInt(halvings);
}

export interface BlockReward {
  pool: Mojos;
  farmer: Mojos;
  total: Mojos;
}

export function blockReward(height: number): BlockReward {
  const base = baseReward(height);
  const pool = (base * 7n) / 8n;
  const farmer = base / 8n;
  return { pool, farmer, total: pool + farmer };
}
