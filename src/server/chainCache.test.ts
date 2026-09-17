import { describe, expect, test } from "bun:test";
import type { BlockchainState, BlockRecord, FeeEstimate } from "@/shared/lib/rpc/types";
import { ChainCache, RECORDS_KEEP } from "./chainCache";
import type { BlockStats, SequencedEvent } from "./eventHub";

const record = (height: number): BlockRecord => ({
  height,
  headerHash: `h${height}`,
  prevHash: `h${height - 1}`,
  weight: 1n,
  totalIters: 1n,
  timestamp: height % 3 === 0 ? 1_700_000_000 + height : null,
  fees: height % 3 === 0 ? 5n : null,
  farmerPuzzleHash: "f",
  poolPuzzleHash: "p",
  prevTransactionBlockHash: null,
  prevTransactionBlockHeight: height - 1,
  rewardClaimsIncorporated: null,
  overflow: false,
  signagePointIndex: 0,
  deficit: 0,
  subEpochSummaryIncluded: false,
  isTransactionBlock: height % 3 === 0,
});

function setup(peak: number) {
  const calls: string[] = [];
  const emitted: { type: string }[] = [];
  const listeners = new Set<(e: SequencedEvent) => void>();
  const blockStats = new Map<number, BlockStats>();
  let now = 1_000_000;
  const state = (h: number): BlockchainState => ({ peak: record(h), space: 1n, difficulty: 1, subSlotIters: 1, averageBlockTime: 18.75, blockMaxCost: 11_000_000_000, mempoolSize: 3, mempoolCost: 10, mempoolFees: 1n, mempoolMaxTotalCost: 1, mempoolMinFees: {}, synced: true, nodeId: "n" });
  let current = peak;
  const cache = new ChainCache("mainnet", {
    client: {
      getBlockchainState: async () => {
        calls.push("state");
        return state(current);
      },
      getBlockRecords: async (start, end) => {
        calls.push(`records:${start}-${end}`);
        return Array.from({ length: end - start }, (_, i) => record(start + i));
      },
      getBlockTransactions: async (height) => {
        calls.push(`txs:${height}`);
        return { transactions: [], truncated: false, nextCursor: null };
      },
      getFeeEstimate: async () => {
        calls.push("fee");
        return { targetTimes: [60], estimates: [1n], currentFeeRate: 0, feeRateLastBlock: 0, feesLastBlock: 0n, lastBlockCost: 0, lastTxBlockHeight: current, peakHeight: current, mempoolCost: 0, mempoolMaxCost: 1, mempoolFees: 0n, numSpends: 0, nodeTimeUtc: 0, synced: true } satisfies FeeEstimate;
      },
    },
    hub: { emit: (event) => emitted.push(event), on: (l) => (listeners.add(l), () => listeners.delete(l)), status: () => ({ network: "mainnet", channel: "websocket", connectedAt: 1, lastEventAt: 1, reconnects: 0, counters: {}, seq: 1 }), blockStats },
    now: () => now,
    timers: false,
  });
  const emit = (event: SequencedEvent["event"]) => listeners.forEach((l) => l({ seq: 1, at: now, event }));
  return { cache, calls, emit, emitted, setPeak: (h: number) => (current = h), tick: (ms: number) => (now += ms), blockStats };
}

describe("ChainCache", () => {
  test("backfills the window on start and serves a snapshot", async () => {
    const { cache, calls } = setup(1000);
    cache.start();
    await cache.refreshAll();
    const snap = cache.snapshot(10)!;
    expect(snap.state.peak.height).toBe(1000);
    expect(snap.blocks.map((b) => b.height).slice(0, 3)).toEqual([1000, 999, 998]);
    expect(snap.blocks).toHaveLength(10);
    expect(snap.fee?.estimate.peakHeight).toBe(1000);
    expect(calls.filter((c) => c.startsWith("records"))).toEqual([`records:${1001 - RECORDS_KEEP}-1001`]);
  });

  test("a peak event fetches only the new records and refreshes the fee on transaction blocks", async () => {
    const { cache, calls, emit, setPeak, tick } = setup(1000);
    cache.start();
    await cache.refreshAll();
    calls.length = 0;
    setPeak(1002);
    tick(10_000);
    emit({ type: "peak", height: 1002, tx: true });
    await new Promise((r) => setTimeout(r, 5));
    expect(calls).toContain("state");
    expect(calls).toContain("records:1001-1003");
    expect(calls).toContain("fee");
    expect(cache.recentBlocks(2).map((b) => b.height)).toEqual([1002, 1001]);
  });

  test("a reorg drops the affected records and refetches", async () => {
    const { cache, calls, emit, setPeak, tick } = setup(1000);
    cache.start();
    await cache.refreshAll();
    calls.length = 0;
    setPeak(999);
    tick(10_000);
    emit({ type: "reorg", oldHeight: 1000, newHeight: 999, depth: 2 });
    await new Promise((r) => setTimeout(r, 5));
    expect(calls.some((c) => c.startsWith("records:"))).toBe(true);
    expect(cache.recentBlocks(1)[0]?.height).toBe(999);
  });

  test("fetches asset totals once per transaction block and serves them in the snapshot", async () => {
    const { cache, calls, emitted } = setup(1000);
    cache.start();
    await cache.refreshAll();
    await new Promise((r) => setTimeout(r, 5));
    const txCalls = calls.filter((c) => c.startsWith("txs:"));
    expect(txCalls.length).toBeGreaterThan(0);
    expect(new Set(txCalls).size).toBe(txCalls.length);
    const snap = cache.snapshot()!;
    expect(Object.keys(snap.assets).length).toBe(txCalls.length);
    expect(emitted.map((e) => e.type)).toEqual(["chain", "chain"]);
    expect(snap.assets["999"]).toMatchObject({ source: "coinset", count: 0 });
    calls.length = 0;
    await cache.refreshAssets();
    expect(calls.filter((c) => c.startsWith("txs:"))).toEqual([]);
  });

  test("attaches dashboard block stats to the records it has", async () => {
    const { cache, blockStats } = setup(1000);
    blockStats.set(999, { height: 999, headerHash: "h999", timestampMs: 1, isTransactionBlock: true, txCount: 4, coinSpendCount: 9, totalCost: 100, totalFee: "5", avgFeeRate: 0.05, costPercent: 1 });
    cache.start();
    await cache.refreshAll();
    expect(cache.snapshot()!.stats.map((s) => s.height)).toEqual([999]);
  });
});
