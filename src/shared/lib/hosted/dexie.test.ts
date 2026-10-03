import { describe, expect, test } from "bun:test";
import type { FetchLike } from "@/shared/lib/rpc/client";
import {
  createDexieFetch,
  nodexchDexieIconUrl,
  nodexchDexieUrl,
  type DexieRoute,
} from "./dexie";

const GATEWAY = "https://nodexch.space";
const TICKERS = "https://api.dexie.space/v3/prices/tickers";
const ROUTE: DexieRoute = { gateway: GATEWAY, apiKey: "nxp_key" };

/** A fake fetch that answers per URL and records every call. */
function fakeFetch(answer: (url: string) => Response | "throw" | "hang") {
  const calls: { url: string; auth: string | null }[] = [];
  const fetch: FetchLike = (input, init) => {
    const url = String(input);
    calls.push({ url, auth: new Headers(init?.headers).get("authorization") });
    const a = answer(url);
    if (a === "throw") return Promise.reject(new TypeError("fetch failed"));
    if (a === "hang")
      return new Promise((_, reject) =>
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError"))
        )
      );
    return Promise.resolve(a);
  };
  return { fetch, calls };
}

const status = (code: number) => new Response("{}", { status: code });

describe("nodexchDexieUrl", () => {
  test("moves a Dexie API URL under the gateway's /dexie, query included", () => {
    expect(
      nodexchDexieUrl(
        `${GATEWAY}/`,
        "https://api.dexie.space/v1/assets?type=cat&page_size=100&page=2"
      )
    ).toBe(`${GATEWAY}/dexie/v1/assets?type=cat&page_size=100&page=2`);
  });

  test("leaves every other host alone, the icon host too", () => {
    expect(nodexchDexieUrl(GATEWAY, "https://icons.dexie.space/ab.webp")).toBeNull();
    expect(nodexchDexieUrl(GATEWAY, "https://api.dexie.space.evil.example/v1/assets")).toBeNull();
    expect(nodexchDexieUrl(GATEWAY, "https://api.mintgarden.io/nfts/x")).toBeNull();
  });
});

describe("nodexchDexieIconUrl", () => {
  test("a CAT's icon is the gateway's file for its asset id", () => {
    expect(nodexchDexieIconUrl("https://api.nodexch.space/", `0x${"AB".repeat(32)}`)).toBe(
      `https://api.nodexch.space/dexie/icons/${"ab".repeat(32)}.webp`
    );
  });
});

describe("createDexieFetch", () => {
  test("asks the gateway with the key while nodexch is the provider", async () => {
    const f = fakeFetch(() => status(200));
    const fetch = createDexieFetch({ route: () => ROUTE, fetch: f.fetch });
    await fetch(TICKERS, { headers: { accept: "application/json" } });
    expect(f.calls).toEqual([
      { url: `${GATEWAY}/dexie/v3/prices/tickers`, auth: "Bearer nxp_key" },
    ]);
  });

  test("asks Dexie directly, without a key, when there is no gateway", async () => {
    const f = fakeFetch(() => status(200));
    const fetch = createDexieFetch({ route: () => null, fetch: f.fetch });
    await fetch(TICKERS);
    expect(f.calls).toEqual([{ url: TICKERS, auth: null }]);
  });

  test("the route is read per request, so a provider change applies at once", async () => {
    const f = fakeFetch(() => status(200));
    let route: DexieRoute | null = null;
    const fetch = createDexieFetch({ route: () => route, fetch: f.fetch });
    await fetch(TICKERS);
    route = ROUTE;
    await fetch(TICKERS);
    expect(f.calls.map((c) => c.url)).toEqual([TICKERS, `${GATEWAY}/dexie/v3/prices/tickers`]);
  });

  for (const code of [401, 403, 429, 500, 502, 503]) {
    test(`HTTP ${code} from the gateway falls back to Dexie without the key`, async () => {
      const f = fakeFetch((url) => status(url.startsWith(GATEWAY) ? code : 200));
      const fetch = createDexieFetch({ route: () => ROUTE, fetch: f.fetch });
      const response = await fetch(TICKERS);
      expect(response.status).toBe(200);
      expect(f.calls.at(-1)).toEqual({ url: TICKERS, auth: null });
    });
  }

  test("an unreachable gateway falls back to Dexie, and the next request asks nodexch again", async () => {
    let down = true;
    const f = fakeFetch((url) => (url.startsWith(GATEWAY) && down ? "throw" : status(200)));
    const fetch = createDexieFetch({ route: () => ROUTE, fetch: f.fetch });
    await fetch(TICKERS);
    down = false;
    await fetch(TICKERS);
    expect(f.calls.map((c) => c.url)).toEqual([
      `${GATEWAY}/dexie/v3/prices/tickers`,
      TICKERS,
      `${GATEWAY}/dexie/v3/prices/tickers`,
    ]);
  });

  test("a gateway that does not answer in time falls back to Dexie", async () => {
    const f = fakeFetch((url) => (url.startsWith(GATEWAY) ? "hang" : status(200)));
    const fetch = createDexieFetch({ route: () => ROUTE, fetch: f.fetch, timeoutMs: 5 });
    const response = await fetch(TICKERS);
    expect(response.status).toBe(200);
    expect(f.calls.at(-1)?.url).toBe(TICKERS);
  });

  test("Dexie's own 404 through the gateway is the answer, not a reason to ask twice", async () => {
    const f = fakeFetch(() => status(404));
    const fetch = createDexieFetch({ route: () => ROUTE, fetch: f.fetch });
    const response = await fetch("https://api.dexie.space/v1/offers/unknown");
    expect(response.status).toBe(404);
    expect(f.calls).toHaveLength(1);
  });

  test("a request the caller aborted is not retried on Dexie", async () => {
    const f = fakeFetch(() => "hang");
    const fetch = createDexieFetch({ route: () => ROUTE, fetch: f.fetch });
    const controller = new AbortController();
    const pending = fetch(TICKERS, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow();
    expect(f.calls).toHaveLength(1);
  });

  test("another host is passed on untouched, even with a gateway", async () => {
    const f = fakeFetch(() => status(200));
    const fetch = createDexieFetch({ route: () => ROUTE, fetch: f.fetch });
    await fetch("https://api.mintgarden.io/collections?size=1");
    expect(f.calls).toEqual([{ url: "https://api.mintgarden.io/collections?size=1", auth: null }]);
  });

  test("with the fallback off, the gateway's failure is the answer and Dexie is not asked", async () => {
    const refused = fakeFetch(() => status(429));
    const fetch = createDexieFetch({ route: () => ROUTE, fetch: refused.fetch, fallback: false });
    expect((await fetch(TICKERS)).status).toBe(429);
    expect(refused.calls.map((c) => c.url)).toEqual([`${GATEWAY}/dexie/v3/prices/tickers`]);

    const down = fakeFetch(() => "throw");
    const failing = createDexieFetch({ route: () => ROUTE, fetch: down.fetch, fallback: false });
    await expect(failing(TICKERS)).rejects.toThrow("fetch failed");
    expect(down.calls).toHaveLength(1);
  });
});
