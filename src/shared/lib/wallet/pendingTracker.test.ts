import { describe, expect, test } from "bun:test";
import type { CompactMempoolItem } from "@/shared/lib/mempool/types";
import type { ProjectedBlock } from "@/shared/lib/mempool/packing";
import { describePending, EMPTY_TRACKED, pendingLine, trackPending } from "./pendingTracker";

const item = (id: string, feeRate: number): CompactMempoolItem =>
  ({ id, fee: "1", cost: 10, feeRate, spends: 1, additions: [], removals: [], additionCount: 0, removalCount: 0, assets: { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0 }, firstSeen: 0, kind: "xch", assetIds: [] }) as unknown as CompactMempoolItem;
const block = (index: number, items: CompactMempoolItem[], eta: number): ProjectedBlock => ({ index, items, totalCost: 1, fill: 0.5, totalFee: 1n, minFeeRate: 0, maxFeeRate: 1, medianFeeRate: 0.5, etaSeconds: eta });

describe("describePending", () => {
  const a = item("aa", 5);
  const b = item("bb", 0.2);
  const c = item("cc", 0);
  const blocks = [block(0, [a], 20), block(1, [b], 60)];
  test("queued with block, position and eta", () => {
    const s = describePending("0xBB", [a, b, c], blocks);
    expect(s.phase).toBe("queued");
    expect(s.blockIndex).toBe(1);
    expect(s.position).toBe(1);
    expect(s.etaSeconds).toBe(60);
    expect(s.band?.id).toBe("low");
    expect(pendingLine(s)).toBe("Projected block 2 · position 1 of 1");
  });
  test("waiting when in the mempool but outside the projected window", () => {
    expect(describePending("cc", [a, b, c], blocks).phase).toBe("waiting");
  });
  test("broadcast when the mempool has not seen it", () => {
    const s = describePending("dd", [a], blocks);
    expect(s.phase).toBe("broadcast");
    expect(s.blocksAhead).toBe(2);
  });
});

describe("trackPending", () => {
  test("remembers first-seen and reports ids that left", () => {
    const one = trackPending(EMPTY_TRACKED, ["A", "b"], 100);
    expect(one.left).toEqual([]);
    expect(one.state.seen).toEqual({ a: 100, b: 100 });
    const two = trackPending(one.state, ["b", "c"], 200);
    expect(two.left).toEqual(["a"]);
    expect(two.state.seen).toEqual({ b: 100, c: 200 });
  });
});
