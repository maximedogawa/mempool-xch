import { describe, expect, test } from "bun:test";
import { CapabilityManager, REFUSED_KEY, type CapabilityClient } from "./capabilities";

function fakeClient(granted: string[], answers: Record<string, boolean>) {
  const requests: string[] = [];
  let handler: ((e: { full?: string[] }) => void) | null = null;
  const client: CapabilityClient = {
    app: {
      getCapabilities: async () => ({ granted }),
      requestCapabilityGrant: async ({ capability }) => {
        requests.push(String(capability));
        return { granted: answers[String(capability)] ?? false };
      },
      onGrantedCapabilitiesChange: (h) => {
        handler = h;
        return () => {
          handler = null;
        };
      },
    },
  };
  return { client, requests, change: (full: string[]) => handler?.({ full }) };
}

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), data };
}

describe("CapabilityManager", () => {
  test("asks once, remembers a refusal, never re-asks without force", async () => {
    const f = fakeClient(["app.get_capabilities"], { "wallet.get_xch_usd_price": false });
    const m = new CapabilityManager(async () => f.client, memoryStorage());
    expect(await m.ensure("wallet.get_xch_usd_price")).toBe(false);
    expect(await m.ensure("wallet.get_xch_usd_price")).toBe(false);
    expect(await m.ensure("wallet.get_xch_usd_price")).toBe(false);
    expect(f.requests).toEqual(["wallet.get_xch_usd_price"]);
    expect(m.isRefused("wallet.get_xch_usd_price")).toBe(true);
    // Force = the user pressed Enable.
    f.client.app.requestCapabilityGrant = async () => ({ granted: true });
    expect(await m.ensure("wallet.get_xch_usd_price", true)).toBe(true);
    expect(m.has("wallet.get_xch_usd_price")).toBe(true);
  });
  test("already granted capabilities never trigger a request; concurrent asks share one dialog", async () => {
    const f = fakeClient(["wallet.get_sync_status"], { "wallet.get_coins": true });
    const m = new CapabilityManager(async () => f.client, null);
    expect(await m.ensure("wallet.get_sync_status")).toBe(true);
    const [a, b] = await Promise.all([m.ensure("wallet.get_coins"), m.ensure("wallet.get_coins")]);
    expect(a && b).toBe(true);
    expect(f.requests).toEqual(["wallet.get_coins"]);
  });
  test("follows host grant changes and persists refusals across reloads", async () => {
    const storage = memoryStorage();
    const f = fakeClient([], { "wallet.get_coins": false });
    const m = new CapabilityManager(async () => f.client, storage);
    let notified = 0;
    m.subscribe(() => {
      notified += 1;
    });
    await m.ensure("wallet.get_coins");
    expect(JSON.parse(storage.data.get(REFUSED_KEY)!)).toEqual(["wallet.get_coins"]);
    f.change(["wallet.get_coins", "wallet.get_sync_status"]);
    expect(m.has("wallet.get_coins")).toBe(true);
    expect(m.isRefused("wallet.get_coins")).toBe(false);
    expect(notified).toBeGreaterThan(0);
    const reloaded = new CapabilityManager(async () => fakeClient([], {}).client, storage);
    expect(reloaded.isRefused("wallet.get_coins")).toBe(false); // the change event cleared it
  });
});
