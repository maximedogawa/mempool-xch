import { describe, expect, test } from "bun:test";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import type { PoolClaim } from "./claims";
import { groupPoolShare, payoutsToResolve } from "./share";

/** A block whose farmer reward goes to `farmerPuzzleHash`; the same address as the pool's by default ("both shares"). */
function block(
  poolPuzzleHash: string,
  height: number,
  farmerPuzzleHash = poolPuzzleHash
): BlockRecord {
  return {
    height,
    headerHash: height.toString(16).padStart(64, "0"),
    prevHash: "0".repeat(64),
    weight: 0n,
    totalIters: 0n,
    timestamp: null,
    fees: null,
    farmerPuzzleHash,
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

const FARMER = "f".repeat(64);
const PLOT_NFT_A = "a".repeat(64);
const PLOT_NFT_B = "b".repeat(64);
const PLOT_NFT_C = "c".repeat(64);
const SOLO = "d".repeat(64);
const UNNAMED_TARGET = "e".repeat(64);
// Registry entries (src/shared/lib/pools/registry.json): NoSSD's fixed payout address, Spacefarmers.io's
// claim target and its separate fixed "both shares" address.
const NOSSD_PAYOUT = "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4";
const SPACEFARMERS_TARGET = "61751cc01a73d5e64a07d6e37b451eed9f157f04da53e3c7d06f355928ba2113";
const SPACEFARMERS_PAYOUT = "405e4339bc6684e79b865b78ec13f5c343edbcb12b3544eacece440de3bf24e4";

const claim = (target: string | null, selfPooled = false): PoolClaim => ({ target, selfPooled });
const NO_CLAIMS = new Map<string, PoolClaim>();

describe("groupPoolShare", () => {
  test("without claims every payout address is its own row, most blocks first with a stable tiebreak", () => {
    const records = [
      block(PLOT_NFT_B, 1),
      block(PLOT_NFT_A, 2),
      block(PLOT_NFT_C, 3),
      block(PLOT_NFT_C, 4),
    ];
    const result = groupPoolShare(records, NO_CLAIMS);
    expect(result.totalBlocks).toBe(4);
    expect(result.payoutCount).toBe(3);
    expect(result.groups.map((g) => g.key)).toEqual([
      `address:${PLOT_NFT_C}`,
      `address:${PLOT_NFT_A}`,
      `address:${PLOT_NFT_B}`,
    ]);
    expect(result.groups.map((g) => g.kind)).toEqual(["address", "address", "address"]);
    expect(result.groups[0]!.share).toBeCloseTo(0.5, 5);
    expect(result.namedShare).toBe(0);
  });

  test("farmers whose rewards are claimed to the same target merge into one pool", () => {
    const records = [
      block(PLOT_NFT_A, 1, FARMER),
      block(PLOT_NFT_B, 2, FARMER),
      block(PLOT_NFT_B, 3, FARMER),
      block(PLOT_NFT_C, 4, FARMER),
    ];
    const claims = new Map([
      [PLOT_NFT_A, claim(UNNAMED_TARGET)],
      [PLOT_NFT_B, claim(UNNAMED_TARGET)],
      [PLOT_NFT_C, claim(null)],
    ]);
    const result = groupPoolShare(records, claims);
    expect(result.groups).toHaveLength(2);
    const pool = result.groups[0]!;
    expect(pool).toMatchObject({
      kind: "claim",
      claimTarget: UNNAMED_TARGET,
      blocks: 3,
      share: 0.75,
      selfPooled: false,
    });
    expect(pool.payouts.map((p) => [p.payoutHash, p.blocks])).toEqual([
      [PLOT_NFT_B, 2],
      [PLOT_NFT_A, 1],
    ]);
    expect(result.groups[1]).toMatchObject({ kind: "address", claimTarget: null, blocks: 1 });
  });

  test("a registry pool collects its claim target's farmers and its fixed payout address in one row", () => {
    const records = [
      block(PLOT_NFT_A, 1, FARMER),
      block(PLOT_NFT_B, 2, FARMER),
      block(SPACEFARMERS_PAYOUT, 3),
      block(NOSSD_PAYOUT, 4),
    ];
    const claims = new Map([
      [PLOT_NFT_A, claim(SPACEFARMERS_TARGET)],
      [PLOT_NFT_B, claim(SPACEFARMERS_TARGET)],
    ]);
    const result = groupPoolShare(records, claims);
    expect(result.groups.map((g) => [g.entry?.name, g.kind, g.blocks])).toEqual([
      ["Spacefarmers.io", "pool", 3],
      ["NoSSD", "pool", 1],
    ]);
    expect(result.groups[0]!.payouts).toHaveLength(3);
    expect(result.namedBlocks).toBe(4);
    expect(result.namedShare).toBe(1);
  });

  test("a group is self-pooled only when every one of its PlotNFTs was", () => {
    const records = [
      block(PLOT_NFT_A, 1, FARMER),
      block(PLOT_NFT_B, 2, FARMER),
      block(PLOT_NFT_C, 3, FARMER),
    ];
    const solo = groupPoolShare(records, new Map([[PLOT_NFT_A, claim(UNNAMED_TARGET, true)]]));
    expect(solo.groups.find((g) => g.kind === "claim")!.selfPooled).toBe(true);
    const mixed = groupPoolShare(
      records,
      new Map([
        [PLOT_NFT_A, claim(UNNAMED_TARGET, true)],
        [PLOT_NFT_B, claim(UNNAMED_TARGET, false)],
      ])
    );
    expect(mixed.groups.find((g) => g.kind === "claim")!.selfPooled).toBe(false);
  });

  test("both shares is only flagged when every block of the address pays farmer and pool alike", () => {
    const result = groupPoolShare(
      [block(SOLO, 1), block(SOLO, 2), block(PLOT_NFT_A, 3), block(PLOT_NFT_A, 4, FARMER)],
      NO_CLAIMS
    );
    expect(result.groups.find((g) => g.key === `address:${SOLO}`)!.bothShares).toBe(true);
    expect(result.groups.find((g) => g.key === `address:${PLOT_NFT_A}`)!.bothShares).toBe(false);
  });

  test("an empty window has zero share and no groups", () => {
    const result = groupPoolShare([], NO_CLAIMS);
    expect(result.groups).toEqual([]);
    expect(result.totalBlocks).toBe(0);
    expect(result.namedShare).toBe(0);
  });
});

describe("payoutsToResolve", () => {
  test("skips both-shares addresses and registry-known fixed addresses, most blocks first", () => {
    const records = [
      block(SOLO, 1),
      block(NOSSD_PAYOUT, 2),
      block(PLOT_NFT_A, 3, FARMER),
      block(PLOT_NFT_B, 4, FARMER),
      block(PLOT_NFT_B, 5, FARMER),
    ];
    expect(payoutsToResolve(records)).toEqual([PLOT_NFT_B, PLOT_NFT_A]);
  });
});
