import { describe, expect, test } from "bun:test";
import { isHttpsUrl, isTrustedImageUrl, isTrustedVideoUrl } from "./trustedImage";

describe("isTrustedImageUrl", () => {
  test.each([
    ["https://icons.dexie.space/abcdef.webp", true],
    ["https://assets.mainnet.mintgarden.io/thumbnails/abc.webp", true],
    ["https://ipfs.mintgarden.io/ipfs/bafy.../image.png", true],
    ["https://api.mintgarden.io/nfts/nft1abc.../thumbnail", true],
  ])("accepts a trusted host: %s", (url, expected) => {
    expect(isTrustedImageUrl(url)).toBe(expected);
  });

  test.each([
    ["http://icons.dexie.space/abcdef.webp", "plain http on an otherwise trusted host"],
    ["https://evil.example.com/steal.png", "an untrusted host"],
    ["https://icons.dexie.space.evil.com/x.png", "a lookalike host"],
    ["not a url", "garbage input"],
    ["", "empty string"],
    ["javascript:alert(1)", "a non-http(s) scheme"],
  ])("rejects %s", (url) => {
    expect(isTrustedImageUrl(url)).toBe(false);
  });
});

describe("isTrustedVideoUrl", () => {
  const CID =
    "https://ipfs.mintgarden.io/ipfs/bafybeicricnmminlhze3cllperx2ybead7hcnwidsjshn5tkw7kz7lx7r4";

  test.each([
    ["https://ipfs.mintgarden.io/ipfs/bafy/454.mp4", undefined],
    ["https://ipfs.mintgarden.io/ipfs/bafy/clip.MOV?download=1", undefined],
    ["https://ipfs.mintgarden.io/ipfs/bafy/454.mp4", 1],
    [CID, 3],
    [`${CID}/`, 3],
  ])("a video: %s (data_type %p)", (url, dataType) => {
    expect(isTrustedVideoUrl(url, dataType)).toBe(true);
  });

  test.each([
    [CID, undefined, "no extension and no data_type"],
    [CID, 1, "data_type 1 (image)"],
    [CID, 4, "data_type 4 (audio)"],
    [CID, "3", "a data_type that is not the number 3"],
    ["https://ipfs.mintgarden.io/ipfs/bafy/still.png", 3, "an image extension despite data_type 3"],
    ["https://ipfs.mintgarden.io/ipfs/bafy/song.mp3", 3, "an audio extension despite data_type 3"],
    ["https://evil.example/ipfs/bafy", 3, "an untrusted host"],
    ["https://evil.example/clip.mp4", undefined, "an untrusted host with an extension"],
    ["http://ipfs.mintgarden.io/ipfs/bafy/454.mp4", undefined, "plain http"],
  ])("not a playable video: %s (data_type %p, %s)", (url, dataType) => {
    expect(isTrustedVideoUrl(url, dataType)).toBe(false);
  });
});

describe("isHttpsUrl", () => {
  test("accepts any https URL", () => {
    expect(isHttpsUrl("https://some-wallet-provided-host.example/icon.png")).toBe(true);
  });

  test.each([
    ["http://example.com/icon.png", "plain http"],
    ["not a url", "garbage input"],
    ["javascript:alert(1)", "a non-http(s) scheme"],
  ])("rejects %s", (url) => {
    expect(isHttpsUrl(url)).toBe(false);
  });
});
