import { describe, expect, test } from "bun:test";
import { normaliseMintGardenNft } from "./nftMetadata";

describe("normaliseMintGardenNft", () => {
  test("royalty_percentage is already basis points (out of 10,000), not a percent to scale up", () => {
    // A real MintGarden response for a 3% royalty NFT carries royalty_percentage: 300 (TRADE_PRICE_PERCENTAGE,
    // CHIP-0007 basis points), not 3 or 0.03 — multiplying it by 100 would show "300.00%" instead of "3.00%".
    const result = normaliseMintGardenNft({ data: {}, royalty_percentage: 300 });
    expect(result.royaltyBasisPoints).toBe(300);
  });

  test("no royalty field yields null rather than 0", () => {
    const result = normaliseMintGardenNft({ data: {} });
    expect(result.royaltyBasisPoints).toBeNull();
  });
});
