import { describe, expect, test } from "bun:test";
import bbbVideoNft from "@/test-utils/fixtures/mintgardenBbbVideoNft.json";
import todayVideoNft from "@/test-utils/fixtures/mintgardenTodayVideoNft.json";
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

/**
 * TASK-097, over the BBB #454 record recorded from api.mintgarden.io on 2026-09-23. Its data_uri
 * names the file (454.mp4); MintGarden's gateway serves the same video under its bare file CID
 * too (bafybeicricn…, from the ETag of a HEAD on the named path, answered with video/mp4 on
 * both), which is the shape that used to reach <img>: no extension to go by.
 */
describe("a video whose data_uri has no file extension", () => {
  /**
   * "Today" (FlipThisMusic), recorded 2026-09-23: a real data_type 3 record whose only data_uri
   * is a bare CIDv0 on a Filebase gateway. Both that URL and the same CID on
   * ipfs.mintgarden.io answered a HEAD with video/mp4, 94,005,416 bytes.
   */
  test("the recorded Today record plays, from MintGarden's gateway", () => {
    const [source] = todayVideoNft.data.data_uris;
    expect(todayVideoNft.data.data_type).toBe(3);
    expect(source).not.toMatch(/\.[a-z0-9]{2,4}$/i);
    const meta = normaliseMintGardenNft(todayVideoNft);
    expect(meta.videoUrl).toBe(
      "https://ipfs.mintgarden.io/ipfs/QmeM6MBn5EJ4JmUAov1EgukNmrQe3KMpYfTtE1FsgMGqmL"
    );
    // Only the still is an image candidate: neither form of the CID reaches an <img>.
    expect(meta.imageUrls).toEqual([todayVideoNft.data.thumbnail_uri]);
  });

  test("a named mp4 on another IPFS gateway plays from MintGarden's, whatever the data_type", () => {
    const meta = normaliseMintGardenNft({
      data: {
        // Shape of "Chia Wallet Notifications", a record MintGarden gives data_type 2.
        data_type: 2,
        data_uris: [
          "https://nftstorage.link/ipfs/bafybeigo43srre467xfq2h7ea4z3l3rbrmzsfj4fohcxx54skkxbszcksu/2023-02-27-chia-wallet-notifications.mp4",
        ],
      },
    });
    expect(meta.videoUrl).toBe(
      "https://ipfs.mintgarden.io/ipfs/bafybeigo43srre467xfq2h7ea4z3l3rbrmzsfj4fohcxx54skkxbszcksu/2023-02-27-chia-wallet-notifications.mp4"
    );
    expect(meta.imageUrls).toEqual([]);
  });

  const BARE_CID_URL =
    "https://ipfs.mintgarden.io/ipfs/bafybeicricnmminlhze3cllperx2ybead7hcnwidsjshn5tkw7kz7lx7r4";
  const withDataUris = (uris: string[], ...dataType: [unknown?]) => ({
    ...bbbVideoNft,
    data: {
      ...bbbVideoNft.data,
      data_uris: uris,
      data_type: dataType.length ? dataType[0] : bbbVideoNft.data.data_type,
    },
  });

  test("the recorded record: the named mp4 is the video", () => {
    const meta = normaliseMintGardenNft(bbbVideoNft);
    expect(bbbVideoNft.data.data_type).toBe(3);
    expect(meta.videoUrl).toBe(bbbVideoNft.data.data_uris[0]!);
    expect(meta.imageUrls).toEqual([bbbVideoNft.data.thumbnail_uri]);
  });

  test("the bare CID plays as the video because the record says data_type 3", () => {
    const meta = normaliseMintGardenNft(
      withDataUris([
        BARE_CID_URL,
        "ipfs://bafybeicricnmminlhze3cllperx2ybead7hcnwidsjshn5tkw7kz7lx7r4",
      ])
    );
    expect(meta.videoUrl).toBe(BARE_CID_URL);
    // The thumbnail is the poster; the CID is never offered to an <img>.
    expect(meta.imageUrls).toEqual([bbbVideoNft.data.thumbnail_uri]);
  });

  test("without data_type 3 the same bare CID stays an image candidate", () => {
    for (const dataType of [1, 2, 4, 0, undefined]) {
      const meta = normaliseMintGardenNft(withDataUris([BARE_CID_URL], dataType));
      expect(meta.videoUrl).toBeNull();
      expect(meta.imageUrls).toContain(BARE_CID_URL);
    }
  });

  test("data_type 3 never makes a non-IPFS untrusted URL, or the still thumbnail, the video", () => {
    const meta = normaliseMintGardenNft(withDataUris(["https://evil.example/ipfs/bafyvideo"]));
    expect(meta.videoUrl).toBeNull();
    const extensionlessThumb = normaliseMintGardenNft({
      data: {
        data_type: 3,
        thumbnail_uri: "https://api.mintgarden.io/nfts/nft1abc/thumbnail",
        data_uris: [],
      },
    });
    expect(extensionlessThumb.videoUrl).toBeNull();
  });
});
