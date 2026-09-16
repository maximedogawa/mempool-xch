import { describe, expect, test } from "bun:test";
import mempoolItems from "@/test-utils/fixtures/mempool_items.json";
import { normaliseMempoolItem } from "@/shared/lib/rpc/normalise";
import { classifyCoinSpends, MOD_HASHES } from "./classify";
import { compactMempoolItem } from "./compact";
import { feeBandFor, feeRateToGradientPosition } from "./feeBands";
import { findProjectedPosition, packProjectedBlocks, sortByFeeRate } from "./packing";
import type { CompactMempoolItem } from "./types";

const OPTS = { blockMaxCost: 11_000_000_000, averageBlockTime: 18.75, txBlockRatio: 0.36 };

function item(id: string, fee: bigint, cost: number, firstSeen = 0): CompactMempoolItem {
  return {
    id,
    fee: fee.toString(),
    cost,
    feeRate: cost > 0 ? Number(fee) / cost : 0,
    spends: 1,
    additions: [],
    removals: [],
    additionCount: 0,
    removalCount: 0,
    assets: { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0 },
    firstSeen,
    kind: "xch",
    assetIds: [],
  };
}

describe("compactMempoolItem", () => {
  test("strips reveals and keeps fee, cost and coins", () => {
    const raw = Object.values(mempoolItems.mempool_items)[0];
    const full = normaliseMempoolItem(raw);
    const compact = compactMempoolItem(full, 123);
    expect(compact.id).toBe(full.name);
    expect(compact.fee).toBe(full.fee.toString());
    expect(compact.cost).toBe(full.cost);
    expect(compact.spends).toBe(full.spendBundle.coinSpends.length);
    expect(compact.firstSeen).toBe(123);
    expect(JSON.stringify(compact)).not.toContain("puzzle_reveal");
    expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(raw).length);
  });
});

describe("classifyCoinSpends", () => {
  const coin = { parentCoinInfo: "00".repeat(32), puzzleHash: "11".repeat(32), amount: 1n };
  test("plain xch", () => {
    expect(classifyCoinSpends([{ coin, puzzleReveal: "ff02ffff01", solution: "80" }]).kind).toBe("xch");
  });
  test("cat with asset id extraction", () => {
    const tail = "ab".repeat(32);
    const reveal = `ff02ffff01ff80ffff04ffff01a0${MOD_HASHES.CAT2}ffff04ffff01a0${tail}ff0180`;
    const c = classifyCoinSpends([{ coin, puzzleReveal: reveal, solution: "80" }]);
    expect(c.kind).toBe("cat");
    expect(c.assetIds).toEqual([tail]);
  });
  test("nft beats cat, offer beats everything", () => {
    const reveal = `ff04ffff01a0${MOD_HASHES.CAT2}ffff04ffff01a0${"cd".repeat(32)}ffff04ffff01a0${MOD_HASHES.NFT_STATE_LAYER}`;
    expect(classifyCoinSpends([{ coin, puzzleReveal: reveal, solution: "80" }]).kind).toBe("nft");
    const settlement = { ...coin, puzzleHash: MOD_HASHES.SETTLEMENT_PAYMENTS };
    expect(classifyCoinSpends([{ coin: settlement, puzzleReveal: reveal, solution: "80" }]).kind).toBe("offer");
  });
  test("did and singleton launcher ids", () => {
    const launcher = "ef".repeat(32);
    const reveal = `ffff04ffff01ffa0${MOD_HASHES.SINGLETON_TOP_LAYER_V1_1}ffa0${launcher}a0${"11".repeat(32)}ffa0${MOD_HASHES.DID_INNERPUZ}`;
    const c = classifyCoinSpends([{ coin, puzzleReveal: reveal, solution: "80" }]);
    expect(c.kind).toBe("did");
    expect(c.assetIds).toEqual([launcher]);
    expect(classifyCoinSpends([]).kind).toBe("unknown");
  });
});

describe("packProjectedBlocks", () => {
  test("empty mempool gives no blocks", () => {
    expect(packProjectedBlocks([], OPTS)).toEqual([]);
  });
  test("single item gives one partially filled block", () => {
    const blocks = packProjectedBlocks([item("a", 100n, 5_500_000_000)], OPTS);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.fill).toBeCloseTo(0.5, 5);
    expect(blocks[0]!.totalFee).toBe(100n);
    expect(blocks[0]!.etaSeconds).toBe(Math.round(18.75 / 0.36));
    expect(blocks[0]!.minFeeRate).toBe(blocks[0]!.maxFeeRate);
  });
  test("packs by descending fee rate and overflows into the next block", () => {
    const items = [
      item("low", 0n, 6_000_000_000, 1),
      item("high", 60_000_000_000n, 6_000_000_000, 2), // 10 mojo/cost
      item("mid", 6_000_000_000n, 6_000_000_000, 3), // 1 mojo/cost
    ];
    const blocks = packProjectedBlocks(items, OPTS);
    expect(blocks.map((b) => b.items.map((i) => i.id))).toEqual([["high"], ["mid"], ["low"]]);
    expect(blocks[0]!.medianFeeRate).toBe(10);
    expect(blocks[2]!.etaSeconds).toBeGreaterThan(blocks[0]!.etaSeconds);
  });
  test("a whole block at zero fee is handled", () => {
    const items = Array.from({ length: 5 }, (_, i) => item(`z${i}`, 0n, 2_000_000_000, i));
    const blocks = packProjectedBlocks(items, OPTS);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.items.length).toBe(5);
    expect(blocks[0]!.minFeeRate).toBe(0);
    expect(blocks[0]!.fill).toBeCloseTo(10 / 11, 5);
  });
  test("overflowing mempool folds extra blocks into the last visible one", () => {
    const items = Array.from({ length: 40 }, (_, i) => item(`i${i}`, BigInt(40 - i), 5_500_000_000, i));
    const blocks = packProjectedBlocks(items, { ...OPTS, maxBlocks: 3 });
    expect(blocks.length).toBe(3);
    expect(blocks[0]!.items.length).toBe(2);
    expect(blocks[2]!.items.length).toBe(36);
    expect(blocks[2]!.fill).toBe(1);
  });
  test("items larger than a block are skipped and ties are stable", () => {
    const blocks = packProjectedBlocks([item("huge", 1n, 12_000_000_000), item("b", 0n, 1, 5), item("a", 0n, 1, 5)], OPTS);
    expect(blocks.length).toBe(1);
    expect(blocks[0]!.items.map((i) => i.id)).toEqual(["a", "b"]);
    expect(sortByFeeRate([item("x", 5n, 1, 9), item("y", 5n, 1, 1)]).map((i) => i.id)).toEqual(["y", "x"]);
  });
  test("findProjectedPosition", () => {
    const blocks = packProjectedBlocks([item("a", 10n, 1), item("b", 5n, 1)], OPTS);
    expect(findProjectedPosition(blocks, "0xB")?.position).toBe(1);
    expect(findProjectedPosition(blocks, "zzz")).toBeNull();
  });
});

describe("fee bands", () => {
  test("band lookup", () => {
    expect(feeBandFor(0).id).toBe("zero");
    expect(feeBandFor(0.5).id).toBe("low");
    expect(feeBandFor(7).id).toBe("high");
    expect(feeBandFor(1000).id).toBe("extreme");
  });
  test("gradient position is monotonic", () => {
    expect(feeRateToGradientPosition(0)).toBe(0);
    expect(feeRateToGradientPosition(1)).toBeGreaterThan(feeRateToGradientPosition(0.1));
    expect(feeRateToGradientPosition(500)).toBe(1);
  });
});
