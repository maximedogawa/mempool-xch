import { describe, expect, test } from "bun:test";
import blockTransactions from "@/test-utils/fixtures/block_transactions.json";
import { normaliseTxList } from "@/shared/lib/rpc/normalise";
import { collectMemos, flowFromCoins, flowFromEvents, kindFromOuterPuzzleType } from "./flow";

describe("tx flow helpers", () => {
  test("kind mapping from Coinset outer puzzle types", () => {
    expect(kindFromOuterPuzzleType("XCH")).toBe("xch");
    expect(kindFromOuterPuzzleType("CAT")).toBe("cat");
    expect(kindFromOuterPuzzleType("NFT")).toBe("nft");
    expect(kindFromOuterPuzzleType("DID")).toBe("did");
    expect(kindFromOuterPuzzleType("Singleton")).toBe("singleton");
    expect(kindFromOuterPuzzleType(undefined)).toBe("unknown");
  });
  test("flow from a confirmed Coinset summary dedupes coins and sums XCH", () => {
    const tx = normaliseTxList(blockTransactions).transactions[0]!;
    const flow = flowFromEvents(tx.events);
    expect(flow.inputs.length).toBeGreaterThan(0);
    expect(flow.outputs.length).toBe(2);
    expect(flow.inputs[0]!.coinId).toBe("0ff17454d122555c4a6f1aa95369f00bce3b51675b2a67548476f1bebc32116d");
    expect(flow.inputs[0]!.kind).toBe("xch");
    expect(flow.totalIn - flow.totalOut).toBe(tx.feeMojos);
    expect(collectMemos(tx.events)).toEqual([]);
  });
  test("flow from raw coins derives coin ids and carries the cat asset id", () => {
    const coin = { parentCoinInfo: "00".repeat(32), puzzleHash: "11".repeat(32), amount: 5n };
    const flow = flowFromCoins([coin], [{ ...coin, amount: 3n }], "cat", ["ab".repeat(32)]);
    expect(flow.inputs[0]!.coinId).toHaveLength(64);
    expect(flow.inputs[0]!.assetId).toBe("ab".repeat(32));
    expect(flow.totalIn).toBe(0n); // CAT amounts are not XCH totals
    expect(flowFromCoins([coin], [], "unknown", []).inputs[0]!.kind).toBe("xch");
  });
});
