import type { BlockRecord } from "@/shared/lib/rpc/types";
import type { PoolClaim } from "./claims";
import { lookupPool, type PoolEntry } from "./registry";

/** One pool payout address (a block's pool_puzzle_hash) and what it won in the window. */
export interface PayoutRow {
  payoutHash: string;
  blocks: number;
  /** Pool and farmer reward go to the same address on every block: not an official-protocol PlotNFT. */
  bothShares: boolean;
}

/**
 * - `pool`: a registry-named pool, by claim target or fixed payout address.
 * - `claim`: payout addresses whose rewards are claimed to the same, unnamed target.
 * - `address`: a payout address with no resolved claim, on its own.
 */
export type PoolGroupKind = "pool" | "claim" | "address";

export interface PoolGroup {
  key: string;
  kind: PoolGroupKind;
  entry: PoolEntry | null;
  /** Set for `claim` groups. */
  claimTarget: string | null;
  /** `claim` group whose PlotNFTs were all self-pooling: a solo farmer, not a pool. */
  selfPooled: boolean;
  /** `address` group paying both shares to the one address. */
  bothShares: boolean;
  /** Most blocks first. */
  payouts: PayoutRow[];
  blocks: number;
  share: number;
}

export interface PoolShare {
  /** Most blocks first. */
  groups: PoolGroup[];
  totalBlocks: number;
  payoutCount: number;
  /** Blocks won by registry-named pools. */
  namedBlocks: number;
  namedShare: number;
}

function payoutRows(records: readonly BlockRecord[]): PayoutRow[] {
  const rows = new Map<string, PayoutRow>();
  for (const r of records) {
    const bothShares = r.poolPuzzleHash === r.farmerPuzzleHash;
    const row = rows.get(r.poolPuzzleHash);
    if (row) {
      row.blocks += 1;
      row.bothShares &&= bothShares;
    } else {
      rows.set(r.poolPuzzleHash, { payoutHash: r.poolPuzzleHash, blocks: 1, bothShares });
    }
  }
  return [...rows.values()].sort(
    (a, b) => b.blocks - a.blocks || a.payoutHash.localeCompare(b.payoutHash)
  );
}

/**
 * The payout addresses worth a claim lookup, most blocks first: a both-shares address is not a
 * PlotNFT, and a registry-known fixed address is already named.
 */
export function payoutsToResolve(records: readonly BlockRecord[]): string[] {
  return payoutRows(records)
    .filter((row) => !row.bothShares && !lookupPool(row.payoutHash))
    .map((row) => row.payoutHash);
}

/**
 * Pool share of a window of blocks. A pool combines many farmers, each with their own
 * payout address, so addresses are merged by the pool their rewards are claimed to (`claims`,
 * see claims.ts) and by registry entry; whatever is still unresolved stays a row of its own.
 */
export function groupPoolShare(
  records: readonly BlockRecord[],
  claims: ReadonlyMap<string, PoolClaim>
): PoolShare {
  const totalBlocks = records.length;
  const rows = payoutRows(records);
  const groups = new Map<string, PoolGroup>();
  const selfPooledByKey = new Map<string, boolean>();

  for (const row of rows) {
    const claim = claims.get(row.payoutHash);
    const target = claim?.target ?? null;
    const entry = lookupPool(row.payoutHash) ?? (target ? lookupPool(target) : null);
    const kind: PoolGroupKind = entry ? "pool" : target ? "claim" : "address";
    const key = entry
      ? `pool:${entry.name}`
      : target
        ? `claim:${target}`
        : `address:${row.payoutHash}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        kind,
        entry,
        claimTarget: kind === "claim" ? target : null,
        selfPooled: false,
        bothShares: kind === "address" && row.bothShares,
        payouts: [],
        blocks: 0,
        share: 0,
      };
      groups.set(key, group);
    }
    group.payouts.push(row);
    group.blocks += row.blocks;
    if (kind === "claim")
      selfPooledByKey.set(key, (selfPooledByKey.get(key) ?? true) && claim!.selfPooled);
  }

  const sorted = [...groups.values()].sort(
    (a, b) => b.blocks - a.blocks || a.key.localeCompare(b.key)
  );
  for (const group of sorted) {
    group.share = totalBlocks > 0 ? group.blocks / totalBlocks : 0;
    group.selfPooled = selfPooledByKey.get(group.key) ?? false;
  }
  const namedBlocks = sorted.filter((g) => g.kind === "pool").reduce((sum, g) => sum + g.blocks, 0);
  return {
    groups: sorted,
    totalBlocks,
    payoutCount: rows.length,
    namedBlocks,
    namedShare: totalBlocks > 0 ? namedBlocks / totalBlocks : 0,
  };
}
