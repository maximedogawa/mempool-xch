import { describe, expect, test } from "bun:test";
import { fetchTokenMap } from "./useTokenList";

describe("fetchTokenMap", () => {
  test("loads the CAT registry from Dexie directly", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (url: RequestInfo | URL) => {
      calls.push(String(url));
      return new Response(
        JSON.stringify({
          success: true,
          count: 1,
          page: 1,
          page_size: 100,
          assets: [{ id: "cd".repeat(32), name: "Other", code: "oth" }],
        }),
        { status: 200 }
      );
    }) as typeof fetch;
    const tokens = await fetchTokenMap(fetchImpl);
    expect(calls).toEqual(["https://api.dexie.space/v1/assets?type=cat&page_size=100&page=1"]);
    expect(tokens["cd".repeat(32)]!.symbol).toBe("OTH");
    expect(tokens["cd".repeat(32)]!.iconUrl).toBe(
      `https://icons.dexie.space/${"cd".repeat(32)}.webp`
    );
  });
});
