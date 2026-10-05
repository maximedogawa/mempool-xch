import { describe, expect, test } from "bun:test";
import type { BlockRecord } from "@/shared/lib/rpc/types";
import { addRecentBlock, recentWindow } from "./recent";

const block = (height: number, tx: boolean, hash = `h${height}`) =>
  ({ height, headerHash: hash, isTransactionBlock: tx }) as BlockRecord;

describe("recent blocks from pushed block frames", () => {
  const start = recentWindow([block(10, true), block(11, false), block(12, true)], 2);

  test("a new transaction block slides the window; the blocks between it stay for gap markers", () => {
    const after = addRecentBlock(addRecentBlock(start, block(13, false), 2), block(14, true), 2);
    expect(after.txBlocks.map((b) => b.height)).toEqual([14, 12]);
    expect(after.all.map((b) => b.height)).toEqual([14, 13, 12]);
  });

  test("a block seen again changes nothing; another block at a height replaces it", () => {
    expect(addRecentBlock(start, block(12, true), 2)).toBe(start);
    const reorged = addRecentBlock(start, block(12, true, "other"), 2);
    expect(reorged.txBlocks[0]?.headerHash).toBe("other");
    expect(reorged.all.filter((b) => b.height === 12).length).toBe(1);
  });
});
