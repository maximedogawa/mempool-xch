import { describe, expect, test } from "bun:test";
import { fetchTokenMap } from "./useTokenList";

const map = { ["ab".repeat(32)]: { assetId: "ab".repeat(32), name: "Spacebucks", symbol: "SBX", iconUrl: null, website: null, description: null } };

describe("fetchTokenMap", () => {
  test("uses the hosted registry when it answers", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: RequestInfo | URL) => {
      calls.push(String(url));
      return new Response(JSON.stringify({ tokens: map }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    const tokens = await fetchTokenMap(fetchImpl);
    expect(tokens["ab".repeat(32)]!.symbol).toBe("SBX");
    expect(calls).toEqual(["/api/assets/tokens"]);
  });
  test("falls back to Dexie's pages when the hosted registry is unavailable", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: RequestInfo | URL) => {
      calls.push(String(url));
      if (String(url).includes("/api/assets/tokens")) return new Response("nope", { status: 503 });
      return new Response(JSON.stringify({ success: true, count: 1, page: 1, page_size: 100, assets: [{ id: "cd".repeat(32), name: "Other", code: "oth" }] }), { status: 200 });
    }) as typeof fetch;
    const tokens = await fetchTokenMap(fetchImpl);
    expect(calls[0]).toBe("/api/assets/tokens");
    expect(calls[1]).toBe("https://api.dexie.space/v1/assets?type=cat&page_size=100&page=1");
    expect(calls).toHaveLength(2);
    expect(tokens["cd".repeat(32)]!.symbol).toBe("OTH");
    expect(tokens["cd".repeat(32)]!.iconUrl).toBe(`https://icons.dexie.space/${"cd".repeat(32)}.webp`);
  });
});
