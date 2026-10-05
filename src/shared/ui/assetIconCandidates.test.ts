import { describe, expect, test } from "bun:test";
import { catIconCandidates, nftIconCandidates } from "./assetIconCandidates";

const DEXIE = "https://icons.dexie.space/abc.webp";
const MINTGARDEN_THUMB = "https://api.mintgarden.io/nfts/nft1abc.../thumbnail";
const MINTGARDEN_ASSET = "https://assets.mainnet.mintgarden.io/thumbnails/abc.webp";
const UNTRUSTED = "https://evil.example.com/steal.png";

describe("catIconCandidates", () => {
  test("orders wallet, then registry, then Dexie", () => {
    expect(
      catIconCandidates({
        walletIconUrl: "https://wallet.example/icon.png",
        registryIconUrl: MINTGARDEN_ASSET,
        dexieIconUrl: DEXIE,
      })
    ).toEqual(["https://wallet.example/icon.png", MINTGARDEN_ASSET, DEXIE]);
  });

  test("with a nodexch gateway the icon comes from the gateway alone, nothing from Dexie", () => {
    const gateway = "https://api.nodexch.space/dexie/icons/abc.webp";
    expect(
      catIconCandidates({
        walletIconUrl: "https://wallet.example/icon.png",
        registryIconUrl: DEXIE,
        dexieIconUrl: DEXIE,
        gatewayIconUrl: gateway,
      })
    ).toEqual(["https://wallet.example/icon.png", gateway]);
    // A gateway on a host the image allowlist does not know is not used for images.
    expect(
      catIconCandidates({
        registryIconUrl: null,
        dexieIconUrl: DEXIE,
        gatewayIconUrl: "https://gateway.example/dexie/icons/abc.webp",
      })
    ).toEqual([DEXIE]);
  });

  test("drops a plain-http wallet icon", () => {
    expect(
      catIconCandidates({
        walletIconUrl: "http://wallet.example/icon.png",
        registryIconUrl: null,
        dexieIconUrl: DEXIE,
      })
    ).toEqual([DEXIE]);
  });

  test("drops a registry icon from an untrusted host", () => {
    expect(
      catIconCandidates({ walletIconUrl: null, registryIconUrl: UNTRUSTED, dexieIconUrl: DEXIE })
    ).toEqual([DEXIE]);
  });

  test("all missing yields no candidates", () => {
    expect(
      catIconCandidates({ walletIconUrl: null, registryIconUrl: null, dexieIconUrl: null })
    ).toEqual([]);
  });
});

describe("nftIconCandidates", () => {
  test("thumbnail first, then fallback images", () => {
    expect(
      nftIconCandidates({ thumbnailUrl: MINTGARDEN_THUMB, fallbackImageUrls: [MINTGARDEN_ASSET] })
    ).toEqual([MINTGARDEN_THUMB, MINTGARDEN_ASSET]);
  });

  test("drops untrusted fallback candidates", () => {
    expect(
      nftIconCandidates({
        thumbnailUrl: MINTGARDEN_THUMB,
        fallbackImageUrls: [UNTRUSTED, MINTGARDEN_ASSET],
      })
    ).toEqual([MINTGARDEN_THUMB, MINTGARDEN_ASSET]);
  });

  test("no thumbnail, only trusted fallbacks remain", () => {
    expect(
      nftIconCandidates({ thumbnailUrl: null, fallbackImageUrls: [MINTGARDEN_ASSET] })
    ).toEqual([MINTGARDEN_ASSET]);
  });

  test("nothing trusted yields no candidates", () => {
    expect(nftIconCandidates({ thumbnailUrl: null, fallbackImageUrls: [UNTRUSTED] })).toEqual([]);
  });
});
