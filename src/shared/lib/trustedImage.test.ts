import { describe, expect, test } from "bun:test";
import {
  isHttpsUrl,
  isTrustedImageUrl,
  isTrustedVideoUrl,
  mintGardenIpfsUrl,
} from "./trustedImage";

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

describe("mintGardenIpfsUrl", () => {
  const V0 = "QmeM6MBn5EJ4JmUAov1EgukNmrQe3KMpYfTtE1FsgMGqmL";
  const V1 = "bafybeifkatimxvw4abpujmwwc44gbuyilykbujoj57onb2efstnq3zc5l4";
  const MG = "https://ipfs.mintgarden.io/ipfs/";

  test.each([
    [`https://defiant-black-skink.myfilebase.com/ipfs/${V0}`, `${MG}${V0}`],
    [`ipfs://${V0}`, `${MG}${V0}`],
    [`ipfs://${V1}/454.mp4`, `${MG}${V1}/454.mp4`],
    [`ipfs://ipfs/${V1}/454.mp4`, `${MG}${V1}/454.mp4`],
    [`https://nftstorage.link/ipfs/${V1}/454.mp4?x=1#t`, `${MG}${V1}/454.mp4`],
    [`https://${V1}.ipfs.nftstorage.link/454.mp4`, `${MG}${V1}/454.mp4`],
    [`https://${V1}.ipfs.nftstorage.link/?filename=454.mp4`, `${MG}${V1}`],
    [`${MG}${V1}/454.mp4`, `${MG}${V1}/454.mp4`],
  ])("%s → %s", (uri, expected) => {
    expect(mintGardenIpfsUrl(uri)).toBe(expected);
  });

  test.each([
    ["https://arweave.net/0ohcNjSgBjZnG8_Tva191pBSPHsgF2Uts24Vuvly6b4", "not IPFS"],
    ["https://example.com/ipfs/not-a-cid/x.mp4", "a path that only looks like IPFS"],
    ["http://gateway.example/ipfs/QmeM6MBn5EJ4JmUAov1EgukNmrQe3KMpYfTtE1FsgMGqmL", "plain http"],
    ["not a url", "garbage"],
  ])("%s is left alone (%s)", (uri) => {
    expect(mintGardenIpfsUrl(uri)).toBeNull();
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
