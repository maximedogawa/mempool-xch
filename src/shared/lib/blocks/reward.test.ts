import { describe, expect, test } from "bun:test";
import { BLOCKS_PER_YEAR, blockReward } from "./reward";

const XCH = 1_000_000_000_000n;

describe("block reward", () => {
  test("follows the halving schedule with a 7/8 pool and 1/8 farmer split", () => {
    expect(blockReward(1)).toEqual({ pool: 1_750_000_000_000n, farmer: 250_000_000_000n, total: 2n * XCH });
    expect(blockReward(3 * BLOCKS_PER_YEAR - 1).total).toBe(2n * XCH);
    expect(blockReward(3 * BLOCKS_PER_YEAR)).toEqual({ pool: 875_000_000_000n, farmer: 125_000_000_000n, total: XCH });
    expect(blockReward(9_295_514).total).toBe(XCH);
    expect(blockReward(6 * BLOCKS_PER_YEAR).total).toBe(XCH / 2n);
    expect(blockReward(9 * BLOCKS_PER_YEAR).total).toBe(XCH / 4n);
    expect(blockReward(12 * BLOCKS_PER_YEAR).total).toBe(XCH / 8n);
    expect(blockReward(40 * BLOCKS_PER_YEAR).total).toBe(XCH / 8n);
  });

  test("height 0 is the prefarm", () => {
    expect(blockReward(0).total).toBe(21_000_000n * XCH);
    expect(blockReward(0).pool).toBe(18_375_000n * XCH);
  });
});
