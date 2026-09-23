import { describe, expect, test } from "bun:test";
import {
  aggregateBlockWindow,
  blockWindowSeries,
  newestTxBlockPerWindow,
  windowDifficulty,
} from "./aggregate";
import { normaliseBlockchainState, normaliseBlockRecord } from "@/shared/lib/rpc/normalise";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import blockRecords from "@/test-utils/fixtures/block_records.json";
import blockchainState from "@/test-utils/fixtures/blockchain_state.json";

function record(
  height: number,
  opts: { timestamp?: number | null; fees?: bigint | null } = {}
): BlockRecord {
  return {
    height,
    headerHash: `hash${height}`,
    prevHash: `hash${height - 1}`,
    weight: 0n,
    totalIters: 0n,
    timestamp: opts.timestamp === undefined ? 1_000_000 + height * 18 : opts.timestamp,
    fees: opts.fees === undefined ? 0n : opts.fees,
    farmerPuzzleHash: "ff",
    poolPuzzleHash: "ff",
    prevTransactionBlockHash: null,
    prevTransactionBlockHeight: height - 1,
    rewardClaimsIncorporated: null,
    overflow: false,
    signagePointIndex: 0,
    deficit: 0,
    subEpochSummaryIncluded: false,
    isTransactionBlock: opts.timestamp !== null,
  };
}

describe("aggregateBlockWindow", () => {
  test("empty window is null", () => {
    expect(aggregateBlockWindow([])).toBeNull();
  });
  test("a window with no timestamped block is null (all non-transaction blocks)", () => {
    const records = [1, 2, 3].map((h) => record(h, { timestamp: null }));
    expect(aggregateBlockWindow(records)).toBeNull();
  });
  test("mixed tx and non-tx blocks: fee average, share, blocks/hour only count what applies", () => {
    // 3 blocks over 36s: heights 0 (tx, fee 10), 1 (non-tx), 2 (tx, fee 30)
    const records = [
      record(0, { timestamp: 1000, fees: 10n }),
      record(1, { timestamp: null }),
      record(2, { timestamp: 1036, fees: 30n }),
    ];
    const stats = aggregateBlockWindow(records)!;
    expect(stats.avgFeeMojos).toBe(20); // (10+30)/2, non-tx block excluded
    expect(stats.shareOfTxBlocks).toBeCloseTo(2 / 3, 6);
    expect(stats.avgSecondsBetweenTxBlocks).toBe(36);
    // span 36s: 2 tx blocks/36s * 3600 = 200/h; 3 blocks/36s * 3600 = 300/h
    expect(stats.txBlocksPerHour).toBeCloseTo(200, 6);
    expect(stats.blocksPerHour).toBeCloseTo(300, 6);
  });
  test("a single transaction block has no gap to report", () => {
    const stats = aggregateBlockWindow([record(0, { timestamp: 1000, fees: 5n })])!;
    expect(stats.avgSecondsBetweenTxBlocks).toBeNull();
  });
});

describe("blockWindowSeries", () => {
  test("drops empty windows, keeps one point per non-empty window", () => {
    const windows = [
      [record(0, { timestamp: 1000, fees: 10n }), record(1, { timestamp: 1018, fees: 20n })],
      [],
      [record(2, { timestamp: 2000, fees: 40n })],
    ];
    const series = blockWindowSeries(windows);
    expect(series.fees.length).toBe(2);
    expect(series.fees[0]!.v).toBe(15);
    expect(series.fees[1]!.v).toBe(40);
    // only one window has 2+ tx blocks to gap between
    expect(series.timeBetweenTxBlocks.length).toBe(1);
  });
});

describe("windowDifficulty", () => {
  test("weight steps of recorded mainnet blocks equal the node's reported difficulty", () => {
    const records = blockRecords.block_records.map(normaliseBlockRecord);
    const state = normaliseBlockchainState(blockchainState.blockchain_state);
    expect(windowDifficulty(records)).toBe(state.difficulty);
    expect(blockWindowSeries([records]).difficulty.map((p) => p.v)).toEqual([state.difficulty]);
  });
  test("median of the steps; gaps in height and a lone block give nothing", () => {
    const withWeight = (height: number, weight: bigint) => ({ ...record(height), weight });
    expect(
      windowDifficulty([
        withWeight(12, 360n),
        withWeight(10, 100n),
        withWeight(11, 200n),
        withWeight(13, 460n),
      ])
    ).toBe(100);
    expect(windowDifficulty([withWeight(10, 100n), withWeight(12, 300n)])).toBeNull();
    expect(windowDifficulty([withWeight(10, 100n)])).toBeNull();
  });
});

describe("newestTxBlockPerWindow", () => {
  test("one transaction block per window, the highest; windows without one are skipped", () => {
    const picked = newestTxBlockPerWindow([
      [record(1), record(2), record(3, { timestamp: null })],
      [record(4, { timestamp: null })],
      [record(6), record(5)],
    ]);
    expect(picked.map((r) => r.height)).toEqual([2, 6]);
  });
});
