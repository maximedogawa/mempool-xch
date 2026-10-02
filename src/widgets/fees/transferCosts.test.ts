import { describe, expect, test } from "bun:test";
import { transferCostEstimates, TRANSFER_COSTS } from "./transferCosts";

describe("transferCostEstimates", () => {
  test("multiplies each row's cost by the given rate", () => {
    const rows = transferCostEstimates(2);
    expect(rows).toHaveLength(TRANSFER_COSTS.length);
    expect(rows.find((r) => r.id === "plain")!.feeMojos).toBe(22_000_000);
    expect(rows.find((r) => r.id === "offer")!.feeMojos).toBe(180_000_000);
  });
  test("zero rate is zero fee for every row", () => {
    expect(transferCostEstimates(0).every((r) => r.feeMojos === 0)).toBe(true);
  });
});
