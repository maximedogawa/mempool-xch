import { describe, expect, test } from "bun:test";
import { createSettingsStore, DEFAULT_SETTINGS, resolveEndpoints, STORAGE_KEY } from "./store";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

describe("settings store", () => {
  test("defaults, persistence and sanitising", () => {
    const storage = memoryStorage();
    const store = createSettingsStore(storage);
    expect(store.get()).toEqual(DEFAULT_SETTINGS);
    let notified = 0;
    store.subscribe(() => {
      notified += 1;
    });
    store.set({ network: "testnet11", theme: "light" });
    expect(store.get().network).toBe("testnet11");
    expect(notified).toBe(1);
    expect(JSON.parse(storage.data.get(STORAGE_KEY)!).theme).toBe("light");
    const reloaded = createSettingsStore(storage);
    expect(reloaded.get().network).toBe("testnet11");
    reloaded.set({
      network: "bogus" as never,
      recentBlocks: 999,
      endpoints: { mainnet: { rpcUrl: " " } } as never,
    });
    expect(reloaded.get().network).toBe("mainnet");
    expect(reloaded.get().recentBlocks).toBe(8);
    expect(reloaded.get().endpoints.mainnet.rpcUrl).toBe("https://api.coinset.org");
    expect(reloaded.get().endpoints.testnet11.rpcUrl).toBe("https://testnet11.api.coinset.org");
    reloaded.reset();
    expect(reloaded.get()).toEqual(DEFAULT_SETTINGS);
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });
  test("corrupt storage falls back to defaults", () => {
    const store = createSettingsStore(memoryStorage({ [STORAGE_KEY]: "{not json" }));
    expect(store.get()).toEqual(DEFAULT_SETTINGS);
    expect(createSettingsStore(null).get()).toEqual(DEFAULT_SETTINGS);
  });
});

describe("resolveEndpoints", () => {
  test("Coinset unlocks the indexed API and WebSocket", () => {
    const r = resolveEndpoints(DEFAULT_SETTINGS);
    expect(r.isCoinset).toBe(true);
    expect(r.indexedUrl).toBe("https://api.coinset.org");
    expect(r.wsUrl).toBe("wss://api.coinset.org/ws");
  });
  test("custom endpoint switches Coinset-only features off", () => {
    const r = resolveEndpoints({
      ...DEFAULT_SETTINGS,
      endpoints: { ...DEFAULT_SETTINGS.endpoints, mainnet: { rpcUrl: "http://localhost:8555/" } },
    });
    expect(r.isCoinset).toBe(false);
    expect(r.rpcUrl).toBe("http://localhost:8555");
    expect(r.indexedUrl).toBeNull();
    expect(r.wsUrl).toBeNull();
    expect(resolveEndpoints(DEFAULT_SETTINGS, "testnet11").wsUrl).toBe(
      "wss://testnet11.api.coinset.org/ws"
    );
  });
});
