import { describe, expect, test } from "bun:test";
import type { TxSummary } from "@/shared/lib/rpc/types";
import { catAmountMoved, summariseRecentActivity } from "./activity";

const ASSET_A = "a".repeat(64);
const ASSET_B = "b".repeat(64);

function tx(confirmedAtMs: number, receipts: { assetId: string; amount: bigint }[]): TxSummary {
  return {
    id: `${confirmedAtMs}`,
    source: "inferred",
    status: "confirmed",
    cost: 0,
    feeMojos: 0n,
    firstSeenMs: confirmedAtMs,
    confirmedHeight: 1,
    confirmedHeaderHash: null,
    confirmedAtMs,
    removedAtMs: null,
    lastUpdatedMs: confirmedAtMs,
    kind: "transfer",
    events: [
      {
        type: "transfer",
        feeMojos: 0n,
        inputs: [],
        outputs: [],
        memos: [],
        raw: {},
        participants: [
          { p2: "p1", sent: { xch: 0n, cats: [], nfts: [] }, received: { xch: 0n, cats: receipts, nfts: [] } },
        ],
      },
    ],
  };
}

describe("catAmountMoved", () => {
  test("sums only the matching asset across participants and events", () => {
    const t = tx(1000, [
      { assetId: ASSET_A, amount: 100n },
      { assetId: ASSET_B, amount: 999n },
      { assetId: ASSET_A, amount: 50n },
    ]);
    expect(catAmountMoved(t, ASSET_A)).toBe(150n);
    expect(catAmountMoved(t, ASSET_B)).toBe(999n);
  });

  test("is zero when the asset never appears", () => {
    const t = tx(1000, [{ assetId: ASSET_B, amount: 5n }]);
    expect(catAmountMoved(t, ASSET_A)).toBe(0n);
  });
});

describe("summariseRecentActivity", () => {
  test("last seen is the newest (first) record of a desc-ordered page", () => {
    const recent = [tx(3000, [{ assetId: ASSET_A, amount: 10n }]), tx(2000, [{ assetId: ASSET_A, amount: 5n }])];
    const result = summariseRecentActivity(ASSET_A, recent, false);
    expect(result.lastSeenMs).toBe(3000);
    expect(result.sampledSpends).toBe(2);
    expect(result.sampledVolume).toBe(15n);
    expect(result.capped).toBe(false);
  });

  test("capped is true when more transactions exist beyond the sample", () => {
    const result = summariseRecentActivity(ASSET_A, [tx(1000, [])], true);
    expect(result.capped).toBe(true);
  });

  test("an empty sample has no last-seen and zero volume", () => {
    const result = summariseRecentActivity(ASSET_A, [], false);
    expect(result.lastSeenMs).toBeNull();
    expect(result.sampledSpends).toBe(0);
    expect(result.sampledVolume).toBe(0n);
  });
});
