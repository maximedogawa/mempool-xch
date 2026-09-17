import { describe, expect, test } from "bun:test";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { groupPoolShare, summarizePoolShare } from "./share";

function block(poolPuzzleHash: string, height: number): BlockRecord {
  return {
    height,
    headerHash: height.toString(16).padStart(64, "0"),
    prevHash: "0".repeat(64),
    weight: 0n,
    totalIters: 0n,
    timestamp: null,
    fees: null,
    farmerPuzzleHash: poolPuzzleHash,
    poolPuzzleHash,
    prevTransactionBlockHash: null,
    prevTransactionBlockHeight: 0,
    rewardClaimsIncorporated: null,
    overflow: false,
    signagePointIndex: 0,
    deficit: 0,
    subEpochSummaryIncluded: false,
    isTransactionBlock: false,
  };
}

const POOL_A = "a".repeat(64);
const POOL_B = "b".repeat(64);
const POOL_C = "c".repeat(64);

describe("groupPoolShare", () => {
  test("groups by pool puzzle hash, most blocks first, with a stable tiebreak", () => {
    const records = [block(POOL_A, 1), block(POOL_B, 2), block(POOL_A, 3), block(POOL_C, 4), block(POOL_B, 5), block(POOL_A, 6)];
    const result = groupPoolShare(records);
    expect(result.totalBlocks).toBe(6);
    expect(result.rows.map((r) => r.poolPuzzleHash)).toEqual([POOL_A, POOL_B, POOL_C]);
    expect(result.rows.map((r) => r.blocks)).toEqual([3, 2, 1]);
    expect(result.rows[0]!.share).toBeCloseTo(0.5, 5);
    expect(result.rows[1]!.share).toBeCloseTo(1 / 3, 5);
  });

  test("ties break by puzzle hash so the order is deterministic", () => {
    const records = [block(POOL_B, 1), block(POOL_A, 2)];
    const result = groupPoolShare(records);
    expect(result.rows.map((r) => r.poolPuzzleHash)).toEqual([POOL_A, POOL_B]);
  });

  test("an empty window has zero share and no rows", () => {
    const result = groupPoolShare([]);
    expect(result.rows).toEqual([]);
    expect(result.totalBlocks).toBe(0);
    expect(result.identifiedShare).toBe(0);
  });

  test("identified share counts only rows with a registry entry", () => {
    const records = [block(POOL_A, 1), block(POOL_B, 2)];
    const result = groupPoolShare(records);
    const identified = result.rows.filter((r) => r.entry !== null).reduce((s, r) => s + r.blocks, 0);
    expect(result.identifiedBlocks).toBe(identified);
    expect(result.identifiedShare).toBe(result.totalBlocks > 0 ? identified / result.totalBlocks : 0);
  });
});

// NoSSD's registered fixed payout hash (src/shared/lib/pools/registry.json), used so lookupPool resolves.
const NOSSD_HASH = "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4";

describe("summarizePoolShare", () => {
  test("collapses every unidentified address into a single bucket", () => {
    const records = [block(NOSSD_HASH, 1), block(POOL_A, 2), block(POOL_B, 3), block(POOL_C, 4)];
    const summary = summarizePoolShare(groupPoolShare(records));
    expect(summary.named).toHaveLength(1);
    expect(summary.named[0]!.entry.name).toBe("NoSSD");
    expect(summary.named[0]!.blocks).toBe(1);
    expect(summary.unidentified).toEqual({ addressCount: 3, blocks: 3, share: 0.75 });
  });

  test("no unidentified bucket when every block resolves to the registry", () => {
    const summary = summarizePoolShare(groupPoolShare([block(NOSSD_HASH, 1)]));
    expect(summary.unidentified).toBeNull();
  });

  test("empty window has no named pools and no unidentified bucket", () => {
    const summary = summarizePoolShare(groupPoolShare([]));
    expect(summary.named).toEqual([]);
    expect(summary.unidentified).toBeNull();
    expect(summary.totalBlocks).toBe(0);
  });
});
