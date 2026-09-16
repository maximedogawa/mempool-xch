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
  test("falls back to Spacescan when the hosted registry is unavailable", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: RequestInfo | URL) => {
      calls.push(String(url));
      if (String(url).includes("/api/assets/tokens")) return new Response("nope", { status: 503 });
      return new Response(JSON.stringify({ cats: [{ asset_id: `0x${"cd".repeat(32)}`, name: "Other", symbol: "oth" }] }), { status: 200 });
    }) as typeof fetch;
    const tokens = await fetchTokenMap(fetchImpl);
    expect(calls[0]).toBe("/api/assets/tokens");
    expect(calls[1]).toBe("https://api.spacescan.io/tokens");
    expect(tokens["cd".repeat(32)]!.symbol).toBe("OTH");
  });
});
