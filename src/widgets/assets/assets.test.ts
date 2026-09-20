import { describe, expect, test } from "bun:test";
import { normaliseMintGardenNft } from "./nftMetadata";
import {
  fetchDexieTokenMap,
  normaliseTokenList,
  readTokenCache,
  TOKEN_LIST_CACHE_KEY,
  TOKEN_LIST_TTL_MS,
  tokenLabel,
  writeTokenCache,
} from "@/shared/api/tokenList";

describe("tokenList", () => {
  const raw = {
    success: true,
    count: 3,
    page: 1,
    page_size: 100,
    assets: [
      {
        id: `0x${"AB".repeat(32)}`,
        name: " Spacebucks ",
        code: "sbx",
        denom: 1000,
        website: "https://spacebucks.io",
        liquidity: [746.44, 3387460.5],
      },
      { id: "short", name: "bad" },
      { id: "cd".repeat(32), name: "", code: "" },
    ],
  };
  test("normalises and filters", () => {
    const map = normaliseTokenList(raw);
    expect(Object.keys(map)).toEqual(["ab".repeat(32), "cd".repeat(32)]);
    expect(map["ab".repeat(32)]).toEqual({
      assetId: "ab".repeat(32),
      name: "Spacebucks",
      symbol: "SBX",
      iconUrl: `https://icons.dexie.space/${"ab".repeat(32)}.webp`,
      website: "https://spacebucks.io",
      description: null,
      liquidityXch: 746.44,
    });
    expect(map["cd".repeat(32)]!.name).toBe("Unknown token");
    expect(map["cd".repeat(32)]!.liquidityXch).toBeNull();
    expect(map["cd".repeat(32)]!.symbol).toBe("CAT");
    expect(normaliseTokenList(null)).toEqual({});
    expect(tokenLabel(map["ab".repeat(32)], "x")).toBe("Spacebucks (SBX)");
    expect(tokenLabel(undefined, "cd".repeat(32))).toBe("CAT cdcdcdcd…");
  });
  test("walks every Dexie page and merges", async () => {
    const urls: string[] = [];
    const page = (n: number, ids: string[]) => ({
      success: true,
      count: 250,
      page: n,
      page_size: 100,
      assets: ids.map((id) => ({ id, code: `T${n}`, name: `Token ${n}` })),
    });
    const fetchImpl = async (url: string) => {
      urls.push(url);
      const n = Number(new URL(url).searchParams.get("page"));
      const ids =
        n === 3
          ? ["ef".repeat(32)]
          : Array.from({ length: 100 }, (_, i) => (n * 1000 + i).toString(16).padStart(64, "0"));
      return { ok: true, status: 200, text: async () => JSON.stringify(page(n, ids)) };
    };
    const map = await fetchDexieTokenMap(fetchImpl);
    expect(urls).toHaveLength(3);
    expect(Object.keys(map)).toHaveLength(201);
    expect(map["ef".repeat(32)]!.symbol).toBe("T3");
    await expect(
      fetchDexieTokenMap(async () => ({ ok: false, status: 429, text: async () => "" }))
    ).rejects.toThrow("429");
  });
  test("cache honours the ttl", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
    };
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
        metadata_json: {
          name: "ChiaLover #1",
          collection: {
            id: "c1",
            name: "ChiaLover",
            attributes: [{ type: "description", value: "desc" }],
          },
        },
      },
      owner_address: { id: "9fbd", encoded_id: "xch1..." },
      creator_address: { id: "0xAB" },
      // MintGarden's royalty_percentage is CHIP-0007 TRADE_PRICE_PERCENTAGE basis points already
      // (300 = 3%), not a percent needing scaling — see nftMetadata.test.ts for the regression.
      royalty_percentage: 300,
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
    expect(meta.royaltyBasisPoints).toBe(300);
    expect(normaliseMintGardenNft(null).name).toBeNull();
  });
});
