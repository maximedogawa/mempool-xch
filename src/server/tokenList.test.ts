import { describe, expect, test } from "bun:test";
import { TokenRegistry } from "./tokenList";

const upstream = JSON.stringify({ cats: [{ asset_id: `0x${"ab".repeat(32)}`, name: "Spacebucks", symbol: "sbx", preview_url: "https://assets.spacescan.io/x.png" }] });

function deps(responses: { ok: boolean; status: number; body?: string }[]) {
  let now = 1_000_000;
  let calls = 0;
  return {
    calls: () => calls,
    advance: (ms: number) => {
      now += ms;
    },
    deps: {
      now: () => now,
      ttlMs: 10_000,
      fetchImpl: async () => {
        const r = responses[Math.min(calls, responses.length - 1)]!;
        calls += 1;
        return { ok: r.ok, status: r.status, text: async () => r.body ?? "" };
      },
    },
  };
}

describe("TokenRegistry", () => {
  test("fetches upstream once within the TTL and normalises", async () => {
    const d = deps([{ ok: true, status: 200, body: upstream }]);
    const reg = new TokenRegistry(d.deps);
    const first = await reg.get();
    expect(first.tokens["ab".repeat(32)]!.symbol).toBe("SBX");
    expect(first.stale).toBe(false);
    await reg.get();
    await reg.get();
    expect(d.calls()).toBe(1);
    d.advance(10_001);
    await reg.get();
    expect(d.calls()).toBe(2);
  });
  test("serves the last good map when upstream fails and retries later", async () => {
    const d = deps([
      { ok: true, status: 200, body: upstream },
      { ok: false, status: 429 },
      { ok: true, status: 200, body: upstream },
    ]);
    const reg = new TokenRegistry(d.deps);
    await reg.get();
    d.advance(10_001);
    const stale = await reg.get();
    expect(Object.keys(stale.tokens).length).toBe(1);
    expect(stale.stale).toBe(true);
    expect(reg.stats.failures).toBe(1);
    // Within the retry window the failure is not repeated.
    await reg.get();
    expect(d.calls()).toBe(2);
    d.advance(5 * 60_000 + 1);
    const refreshed = await reg.get();
    expect(refreshed.stale).toBe(false);
    expect(d.calls()).toBe(3);
  });
  test("starts empty and non-fatal when upstream is down", async () => {
    const d = deps([{ ok: false, status: 503 }]);
    const reg = new TokenRegistry(d.deps);
    const r = await reg.get();
    expect(r.tokens).toEqual({});
    expect(r.stale).toBe(true);
  });
});
