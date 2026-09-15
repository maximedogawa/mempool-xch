import { describe, expect, test } from "bun:test";
import { normaliseMintGardenNft } from "./nftMetadata";
import { normaliseTokenList, readTokenCache, TOKEN_LIST_CACHE_KEY, TOKEN_LIST_TTL_MS, tokenLabel, writeTokenCache } from "@/shared/api/tokenList";

describe("tokenList", () => {
  const raw = {
    status: "success",
    cats: [
      { asset_id: `0x${"AB".repeat(32)}`, name: " Spacebucks ", symbol: "sbx", preview_url: "https://assets.spacescan.io/cat/x.png", website: "https://spacebucks.io" },
      { asset_id: "short", name: "bad" },
      { asset_id: "cd".repeat(32), name: "", symbol: "", preview_url: "http://insecure/x.png" },
    ],
  };
  test("normalises and filters", () => {
    const map = normaliseTokenList(raw);
    expect(Object.keys(map)).toEqual(["ab".repeat(32), "cd".repeat(32)]);
    expect(map["ab".repeat(32)]).toEqual({
      assetId: "ab".repeat(32),
      name: "Spacebucks",
      symbol: "SBX",
      iconUrl: "https://assets.spacescan.io/cat/x.png",
      website: "https://spacebucks.io",
      description: null,
    });
    expect(map["cd".repeat(32)]!.name).toBe("Unknown token");
    expect(map["cd".repeat(32)]!.iconUrl).toBeNull();
    expect(normaliseTokenList(null)).toEqual({});
    expect(tokenLabel(map["ab".repeat(32)], "x")).toBe("Spacebucks (SBX)");
    expect(tokenLabel(undefined, "cd".repeat(32))).toBe("CAT cdcdcdcd…");
  });
  test("cache honours the ttl", () => {
    const data = new Map<string, string>();
    const storage = { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
    const tokens = normaliseTokenList(raw);
    writeTokenCache(storage, tokens, 1000);
    expect(readTokenCache(storage, 2000)).toEqual(tokens);
    expect(readTokenCache(storage, 1000 + TOKEN_LIST_TTL_MS + 1)).toBeNull();
    data.set(TOKEN_LIST_CACHE_KEY, "{broken");
    expect(readTokenCache(storage)).toBeNull();
  });
});

describe("normaliseMintGardenNft", () => {
  test("extracts name, collection, images and owner", () => {
    const meta = normaliseMintGardenNft({
      id: "98",
      data: {
        data_uris: ["https://ipfs.mintgarden.io/ipfs/x.jfif", "ipfs://x"],
        thumbnail_uri: "https://assets.mainnet.mintgarden.io/thumbnails/a_512.webp",
        preview_uri: "https://assets.mainnet.mintgarden.io/thumbnails/a.webp",
        metadata_json: { name: "ChiaLover #1", collection: { id: "c1", name: "ChiaLover", attributes: [{ type: "description", value: "desc" }] } },
      },
      owner_address: { id: "9fbd", encoded_id: "xch1..." },
      creator_address: { id: "0xAB" },
      royalty_percentage: 15,
    });
    expect(meta.name).toBe("ChiaLover #1");
    expect(meta.collectionName).toBe("ChiaLover");
    expect(meta.description).toBe("desc");
    expect(meta.imageUrls).toEqual([
      "https://assets.mainnet.mintgarden.io/thumbnails/a_512.webp",
      "https://assets.mainnet.mintgarden.io/thumbnails/a.webp",
      "https://ipfs.mintgarden.io/ipfs/x.jfif",
    ]);
    expect(meta.ownerP2).toBe("9fbd");
    expect(meta.creatorP2).toBe("ab");
    expect(meta.royaltyBasisPoints).toBe(1500);
    expect(normaliseMintGardenNft(null).name).toBeNull();
  });
});
