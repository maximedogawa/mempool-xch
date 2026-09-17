import { describe, expect, test } from "bun:test";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { groupPoolShare } from "./share";

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
