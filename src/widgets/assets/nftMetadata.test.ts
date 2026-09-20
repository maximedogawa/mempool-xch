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

test("a video data_uri becomes the artwork, not an image candidate", () => {
  const meta = normaliseMintGardenNft({
    data: {
      thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/still.webp",
      data_uris: [
        "https://ipfs.mintgarden.io/ipfs/bafyvideo/454.mp4",
        "ipfs://bafyvideo/454.mp4",
        "https://evil.example/454.mp4",
      ],
      metadata_json: { name: "BBB #454" },
    },
  });
  expect(meta.videoUrl).toBe("https://ipfs.mintgarden.io/ipfs/bafyvideo/454.mp4");
  // The still remains the poster; the mp4 is never offered to an <img>.
  expect(meta.imageUrls).toEqual([
    "https://assets.mainnet.mintgarden.io/thumbnails/still.webp",
    "https://evil.example/454.mp4",
  ]);
});

test("a still-only NFT has no video", () => {
  const meta = normaliseMintGardenNft({
    data: {
      thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/still.webp",
      data_uris: ["https://ipfs.mintgarden.io/ipfs/bafyimage/1.png"],
      metadata_json: { name: "Still #1" },
    },
  });
  expect(meta.videoUrl).toBeNull();
});
