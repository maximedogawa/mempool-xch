import { describe, expect, test } from "bun:test";
import { FEE_BANDS } from "./feeBands";
import {
  appendSample,
  costWeightedMedianFeeRate,
  loadHistory,
  MAX_SAMPLES,
  MIN_SAMPLE_GAP_MS,
  sampleFromSummary,
  saveHistory,
  type MempoolSample,
} from "./history";
import type { MempoolSummary } from "./types";

const summary: MempoolSummary = {
  network: "mainnet",
  generatedAt: 1_000_000,
  source: "server",
  state: {
    peakHeight: 1,
    peakHash: "",
    lastTxBlockHeight: 1,
    mempoolSize: 2,
    mempoolCost: 30,
    mempoolMaxTotalCost: 100,
    mempoolFees: "500",
    blockMaxCost: 11,
    averageBlockTime: 18.75,
    minFeeRate: 0,
    synced: true,
  },
  items: [
    {
      id: "a",
      fee: "0",
      cost: 10,
      feeRate: 0,
      spends: 1,
      additions: [],
      removals: [],
      additionCount: 0,
      removalCount: 0,
      assets: { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0 },
      firstSeen: 0,
      kind: "xch",
      assetIds: [],
    },
    {
      id: "b",
      fee: "100",
      cost: 20,
      feeRate: 5,
      spends: 1,
      additions: [],
      removals: [],
      additionCount: 0,
      removalCount: 0,
      assets: { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0 },
      firstSeen: 0,
      kind: "cat",
      assetIds: [],
    },
  ],
};

describe("mempool history", () => {
  test("sample buckets cost by fee band", () => {
    const s = sampleFromSummary(summary);
    expect(s.t).toBe(1_000_000);
    expect(s.count).toBe(2);
    expect(s.fees).toBe(500);
    expect(s.bands.length).toBe(FEE_BANDS.length);
    expect(s.bands[0]).toBe(10);
    expect(s.bands[FEE_BANDS.findIndex((b) => b.id === "high")]).toBe(20);
    // Two thirds of the pending cost pays 5, so the cost-weighted median is 5.
    expect(s.medianFeeRate).toBe(5);
  });
  test("median fee rate weighs bundles by cost, not by count", () => {
    const rates = [
      { cost: 100, feeRate: 0 },
      { cost: 10, feeRate: 50 },
      { cost: 10, feeRate: 20 },
    ];
    // Two of three bundles pay a fee, but most of the cost is the free one.
    expect(costWeightedMedianFeeRate(rates)).toBe(0);
    expect(
      costWeightedMedianFeeRate([
        { cost: 10, feeRate: 1 },
        { cost: 30, feeRate: 3 },
      ])
    ).toBe(3);
    expect(costWeightedMedianFeeRate([])).toBe(0);
  });
  test("append respects the minimum gap, the window and the size cap", () => {
    const mk = (t: number): MempoolSample => ({ t, bands: [], count: 0, fees: 0 });
    let h = appendSample([], mk(0));
    h = appendSample(h, mk(MIN_SAMPLE_GAP_MS - 1));
    expect(h.length).toBe(1);
    h = appendSample(h, mk(MIN_SAMPLE_GAP_MS));
    expect(h.length).toBe(2);
    h = appendSample(h, mk(10_000_000), 1_000);
    expect(h.length).toBe(1);
    const many = Array.from({ length: MAX_SAMPLES + 50 }, (_, i) => mk(i * MIN_SAMPLE_GAP_MS));
    const capped = many.reduce(
      (acc, s) => appendSample(acc, s, Number.MAX_SAFE_INTEGER),
      [] as MempoolSample[]
    );
    expect(capped.length).toBe(MAX_SAMPLES);
  });
  test("storage round trip and corrupt data", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
    saveHistory(storage, "mainnet", [{ t: 1, bands: [1], count: 1, fees: 0 }]);
    expect(loadHistory(storage, "mainnet")).toEqual([{ t: 1, bands: [1], count: 1, fees: 0 }]);
    expect(loadHistory(storage, "testnet11")).toEqual([]);
    data.set("mempool-xch:history:v1:mainnet", "{oops");
    expect(loadHistory(storage, "mainnet")).toEqual([]);
    data.set(
      "mempool-xch:history:v1:mainnet",
      JSON.stringify([{ bad: true }, { t: 2, bands: [], count: 0, fees: 0 }])
    );
    expect(loadHistory(storage, "mainnet").length).toBe(1);
  });
});
