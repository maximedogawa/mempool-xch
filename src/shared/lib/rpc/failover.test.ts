import { describe, expect, test } from "bun:test";
import { createFailover, type FetchLike } from "./failover";

const PRIMARY = "https://nodexch.space";
const FALLBACK = "https://api.coinset.org";

/** A fake fetch that answers per origin and records every call. */
function fakeFetch(answer: (url: string) => Response | Promise<Response> | "throw" | "hang") {
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

const ok = (body = "{}") => new Response(body, { status: 200 });
const init = { method: "POST", headers: { authorization: "Bearer nxp_key" }, body: "{}" };

describe("failover", () => {
  test("uses the primary while it answers", async () => {
    const f = fakeFetch(() => ok());
    const failover = createFailover({ primary: PRIMARY, fallback: FALLBACK, fetch: f.fetch });
    await failover.fetch(`${PRIMARY}/get_blockchain_state`, init);
    expect(f.calls.map((c) => c.url)).toEqual([`${PRIMARY}/get_blockchain_state`]);
    expect(failover.get().onFallback).toBe(false);
  });

  test("an unreachable primary moves the request and the app to the fallback, without the key", async () => {
    const f = fakeFetch((url) => (url.startsWith(PRIMARY) ? "throw" : ok()));
    const failover = createFailover({ primary: PRIMARY, fallback: FALLBACK, fetch: f.fetch });
    const response = await failover.fetch(`${PRIMARY}/get_block`, init);
    expect(response.status).toBe(200);
    expect(f.calls[1]).toEqual({ url: `${FALLBACK}/get_block`, auth: null });
    expect(failover.get()).toMatchObject({ onFallback: true, reason: "unreachable" });
    // Later requests go straight to the fallback.
    await failover.fetch(`${PRIMARY}/get_block_record`, init);
    expect(f.calls.at(-1)!.url).toBe(`${FALLBACK}/get_block_record`);
    expect(f.calls.filter((c) => c.url.startsWith(PRIMARY))).toHaveLength(1);
  });

  test("5xx, 401, 403 and 429 switch; 501 moves only that request; other answers stay", async () => {
    for (const status of [502, 503, 401, 403, 429]) {
      const f = fakeFetch((url) => (url.startsWith(PRIMARY) ? new Response("", { status }) : ok()));
      const failover = createFailover({ primary: PRIMARY, fallback: FALLBACK, fetch: f.fetch });
      await failover.fetch(`${PRIMARY}/get_block`, init);
      expect(failover.get(), `status ${status}`).toMatchObject({
        onFallback: true,
        reason: `HTTP ${status}`,
      });
    }
    const index = fakeFetch((url) =>
      url.startsWith(PRIMARY) ? new Response("index not enabled", { status: 501 }) : ok("[]")
    );
    const f501 = createFailover({ primary: PRIMARY, fallback: FALLBACK, fetch: index.fetch });
    expect(await (await f501.fetch(`${PRIMARY}/get_reorgs`, init)).text()).toBe("[]");
    expect(f501.get().onFallback).toBe(false);

    const missing = fakeFetch(() => new Response('{"success":false}', { status: 404 }));
    const f404 = createFailover({ primary: PRIMARY, fallback: FALLBACK, fetch: missing.fetch });
    expect((await f404.fetch(`${PRIMARY}/get_coin_record_by_name`, init)).status).toBe(404);
    expect(f404.get().onFallback).toBe(false);
    expect(missing.calls).toHaveLength(1);
  });

  test("a primary slower than the timeout moves the request", async () => {
    const f = fakeFetch((url) => (url.startsWith(PRIMARY) ? "hang" : ok()));
    const failover = createFailover({
      primary: PRIMARY,
      fallback: FALLBACK,
      fetch: f.fetch,
      timeoutMs: 20,
    });
    const response = await failover.fetch(`${PRIMARY}/get_block`, init);
    expect(response.status).toBe(200);
    expect(failover.get().reason).toBe("timeout");
  });

  test("a request the caller aborts is not a failure", async () => {
    const f = fakeFetch(() => "hang");
    const failover = createFailover({ primary: PRIMARY, fallback: FALLBACK, fetch: f.fetch });
    const controller = new AbortController();
    const pending = failover.fetch(`${PRIMARY}/get_block`, { ...init, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow();
    expect(failover.get().onFallback).toBe(false);
  });

  test("recover returns to the primary and tells subscribers; other hosts pass through", async () => {
    const f = fakeFetch((url) => (url.startsWith(PRIMARY) ? "throw" : ok()));
    let now = 1_000;
    const failover = createFailover({
      primary: PRIMARY,
      fallback: FALLBACK,
      fetch: f.fetch,
      now: () => now,
    });
    const seen: boolean[] = [];
    failover.subscribe(() => seen.push(failover.get().onFallback));
    await failover.fetch(`${PRIMARY}/get_block`, init);
    expect(failover.get().since).toBe(1_000);
    now = 5_000;
    failover.recover();
    expect(failover.get()).toEqual({ onFallback: false, reason: null, since: null });
    expect(seen).toEqual([true, false]);
    await failover.fetch("https://api.dexie.space/v1/assets", {});
    expect(f.calls.at(-1)!.url).toBe("https://api.dexie.space/v1/assets");
  });
});
