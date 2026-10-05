import { describe, expect, test } from "bun:test";
import liveHandle from "@/test-utils/fixtures/mintgardenHandle.json";
import type { MinimalResponse } from "@/shared/lib/nft/mintgarden";
import { fetchAddressHandle, fetchHandleArt } from "./mintgardenHandles";

function okResponse(body: unknown): Promise<MinimalResponse> {
  return Promise.resolve({ ok: true, json: () => Promise.resolve(body) });
}
const missing: Promise<MinimalResponse> = Promise.resolve({
  ok: false,
  json: () => Promise.resolve({}),
});

describe("fetchHandleArt", () => {
  test("reads the name NFT of a live record", async () => {
    const urls: string[] = [];
    const art = await fetchHandleArt("mempoolxch", (url) => {
      urls.push(url);
      return okResponse(liveHandle);
    });
    expect(urls).toEqual(["https://api.mintgarden.io/xchandles/mempoolxch"]);
    expect(art).toEqual({
      nftId: "nft1250ut0lq7v8d06n0ytvfygdvns04lczn7c3g90uz2lzmkmk53keq74gyyl",
      address: "xch1eheuhnlwdjv5wcyzlh8adwqc54usz9yzcc2hsypgmvnr7fqn69xqx5qxrh",
      thumbnailUrl: liveHandle.nft.thumbnail_uri,
    });
  });

  test("an unknown handle, a miss and a failed fetch all give null", async () => {
    expect(
      await fetchHandleArt("nobodyhasthis", () => okResponse({ status: "unknown" }))
    ).toBeNull();
    expect(await fetchHandleArt("mempoolxch", () => missing)).toBeNull();
    expect(
      await fetchHandleArt("mempoolxch", () => Promise.reject(new Error("offline")))
    ).toBeNull();
  });
});

describe("fetchAddressHandle", () => {
  test("names the handle an address holds, stripping 0x from the puzzle hash", async () => {
    const urls: string[] = [];
    const found = await fetchAddressHandle("0xBF03", (url) => {
      urls.push(url);
      return okResponse({ xchandle: "yakuhito", xchandle_count: 1 });
    });
    expect(urls).toEqual(["https://api.mintgarden.io/address/bf03"]);
    expect(found).toEqual({ handle: "yakuhito", count: 1 });
  });

  test("an address with no handle, and one whose registry is mid-sync, give null", async () => {
    expect(await fetchAddressHandle("bf03", () => okResponse({ xchandle: null }))).toBeNull();
    expect(
      await fetchAddressHandle("bf03", () =>
        okResponse({ xchandle: "yakuhito", xchandles_registry_syncing: true })
      )
    ).toBeNull();
    expect(await fetchAddressHandle("", () => okResponse({ xchandle: "x" }))).toBeNull();
  });
});
