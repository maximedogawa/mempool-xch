import { describe, expect, test } from "bun:test";
import { NETWORKS, defaultEndpointUrl, hasHostedNodexch } from "@/shared/config/networks";
import { runtimeConfigScript } from "@/shared/config/runtime";
import {
  createSettingsStore,
  DEFAULT_SETTINGS,
  networkFromSearch,
  resolveEndpoints,
  STORAGE_KEY,
} from "./store";

/** What the server's /runtime-config.js does in a browser. */
const setSiteKeys = (nodexchKeys: Record<string, string>) =>
  new Function(runtimeConfigScript({ nodexchKeys }))();

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
    // A blank endpoint is the network's default provider: nodexch.space on mainnet (TASK-113).
    expect(reloaded.get().endpoints.mainnet.rpcUrl).toBe("https://api.nodexch.space");
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
  test("the default is the hosted nodexch gateway, without a fallback: Coinset is a choice", () => {
    const r = resolveEndpoints(DEFAULT_SETTINGS);
    expect(r.provider).toBe("nodexch");
    expect(r.rpcUrl).toBe("https://api.nodexch.space");
    expect(r.fallback).toBeNull();
  });
  test("a site without its key never sends a visitor to the hosted gateway", () => {
    // The gateway answers 401 without a key: every request of a fresh visitor failed (0.11.0).
    const key = NETWORKS.mainnet.nodexchKey;
    setSiteKeys({});
    try {
      expect(hasHostedNodexch("mainnet")).toBe(false);
      expect(defaultEndpointUrl("mainnet")).toBe("https://api.coinset.org");
      // Settings that already name the gateway (written while the site had its key) read Coinset.
      const stored = resolveEndpoints(DEFAULT_SETTINGS);
      expect(stored).toMatchObject({
        provider: "coinset",
        rpcUrl: "https://api.coinset.org",
        indexedUrl: "https://api.coinset.org",
        wsUrl: "wss://api.coinset.org/ws",
        apiKey: null,
      });
      // The visitor's own key still reaches it.
      const own = resolveEndpoints({
        ...DEFAULT_SETTINGS,
        endpoints: {
          ...DEFAULT_SETTINGS.endpoints,
          mainnet: { rpcUrl: "https://api.nodexch.space", apiKey: "nxp_Zk3vQ0aBq1v0m3J2o0r8c5Tt" },
        },
      });
      expect(own.provider).toBe("nodexch");
      expect(own.apiKey).toBe("nxp_Zk3vQ0aBq1v0m3J2o0r8c5Tt");
      // Old Coinset defaults stay on Coinset instead of moving to a gateway that refuses them.
      const storage = memoryStorage();
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ endpoints: { mainnet: { rpcUrl: "https://api.coinset.org" } } })
      );
      expect(createSettingsStore(storage).get().endpoints.mainnet.rpcUrl).toBe(
        "https://api.coinset.org"
      );
    } finally {
      setSiteKeys({ mainnet: key });
    }
    expect(hasHostedNodexch("mainnet")).toBe(true);
    expect(hasHostedNodexch("testnet11")).toBe(false);
  });
  test("with the automatic fallback on, the hosted gateway falls back to Coinset", () => {
    const r = resolveEndpoints(DEFAULT_SETTINGS, "mainnet", {
      fallbackUrl: "https://api.coinset.org",
    });
    expect(r.provider).toBe("nodexch");
    expect(r.rpcUrl).toBe("https://api.nodexch.space");
    expect(r.indexedUrl).toBe("https://api.nodexch.space");
    expect(r.fallback).toMatchObject({
      provider: "coinset",
      rpcUrl: "https://api.coinset.org",
      indexedUrl: "https://api.coinset.org",
      wsUrl: "wss://api.coinset.org/ws",
      isCoinset: true,
      apiKey: null,
    });
    // Testnet11 has no gateway and the server names no fallback for it: Coinset, on its own.
    const testnet = resolveEndpoints(DEFAULT_SETTINGS, "testnet11");
    expect(testnet.provider).toBe("coinset");
    expect(testnet.fallback).toBeNull();
  });
  test("the fallback the server names: any URL, and for a Coinset main API too", () => {
    // Not Coinset: a plain full-node RPC, as a custom node is.
    const node = resolveEndpoints(DEFAULT_SETTINGS, "mainnet", {
      fallbackUrl: "https://node.example.test/",
    });
    expect(node.provider).toBe("nodexch");
    expect(node.fallback).toMatchObject({
      provider: "custom",
      rpcUrl: "https://node.example.test",
      indexedUrl: null,
      wsUrl: null,
      apiKey: null,
    });
    // The main API never falls back to itself.
    expect(
      resolveEndpoints(DEFAULT_SETTINGS, "mainnet", { fallbackUrl: "https://api.nodexch.space/" })
        .fallback
    ).toBeNull();
    // A site that starts on Coinset (no key) falls back from Coinset.
    const key = NETWORKS.mainnet.nodexchKey;
    setSiteKeys({});
    try {
      const coinset = resolveEndpoints(
        {
          ...DEFAULT_SETTINGS,
          endpoints: {
            ...DEFAULT_SETTINGS.endpoints,
            mainnet: { rpcUrl: "https://api.coinset.org" },
          },
        },
        "mainnet",
        { fallbackUrl: "https://node.example.test" }
      );
      expect(coinset.provider).toBe("coinset");
      expect(coinset.fallback?.rpcUrl).toBe("https://node.example.test");
      // nodexch.space stored without any key: the fallback answers instead of Coinset.
      expect(
        resolveEndpoints(DEFAULT_SETTINGS, "mainnet", { fallbackUrl: "https://node.example.test" })
          .rpcUrl
      ).toBe("https://node.example.test");
    } finally {
      setSiteKeys({ mainnet: key });
    }
  });
  test("an endpoint the visitor chose never falls back", () => {
    const own = resolveEndpoints(
      {
        ...DEFAULT_SETTINGS,
        endpoints: {
          ...DEFAULT_SETTINGS.endpoints,
          mainnet: { rpcUrl: "https://gw.example.test", provider: "nodexch" },
        },
      },
      "mainnet",
      { fallbackUrl: "https://api.coinset.org" }
    );
    expect(own.provider).toBe("nodexch");
    expect(own.fallback).toBeNull();
    const coinset = resolveEndpoints(
      {
        ...DEFAULT_SETTINGS,
        endpoints: {
          ...DEFAULT_SETTINGS.endpoints,
          mainnet: { rpcUrl: "https://api.coinset.org" },
        },
      },
      "mainnet",
      { fallbackUrl: "https://node.example.test" }
    );
    expect(coinset.provider).toBe("coinset");
    expect(coinset.fallback).toBeNull();
  });
  test("settings from before version 2 move the old Coinset default to nodexch once", () => {
    const storage = memoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        network: "mainnet",
        endpoints: {
          mainnet: { rpcUrl: "https://api.coinset.org" },
          testnet11: { rpcUrl: "https://testnet11.api.coinset.org" },
        },
      })
    );
    const migrated = createSettingsStore(storage).get();
    expect(migrated.endpoints.mainnet.rpcUrl).toBe("https://api.nodexch.space");
    expect(migrated.endpoints.testnet11.rpcUrl).toBe("https://testnet11.api.coinset.org");
    expect(migrated.providersVersion).toBe(2);
    // A custom node chosen before stays.
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ endpoints: { mainnet: { rpcUrl: "http://127.0.0.1:8556" } } })
    );
    expect(createSettingsStore(storage).get().endpoints.mainnet.rpcUrl).toBe(
      "http://127.0.0.1:8556"
    );
    // Coinset picked in version 2 is a choice, not the old default.
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        providersVersion: 2,
        endpoints: { mainnet: { rpcUrl: "https://api.coinset.org" } },
      })
    );
    expect(createSettingsStore(storage).get().endpoints.mainnet.rpcUrl).toBe(
      "https://api.coinset.org"
    );
  });
  test("Coinset unlocks the indexed API and WebSocket", () => {
    const r = resolveEndpoints({
      ...DEFAULT_SETTINGS,
      endpoints: { ...DEFAULT_SETTINGS.endpoints, mainnet: { rpcUrl: "https://api.coinset.org" } },
    });
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

describe("nodexch endpoints", () => {
  const PUBLISHABLE = "nxp_Zk3vQ0aBq1v0m3J2o0r8c5Tt";
  const withMainnet = (mainnet: Record<string, unknown>) =>
    createSettingsStore(
      memoryStorage({
        [STORAGE_KEY]: JSON.stringify({
          ...DEFAULT_SETTINGS,
          endpoints: { ...DEFAULT_SETTINGS.endpoints, mainnet },
        }),
      })
    ).get();

  test("the hosted gateway is nodexch by its host: indexed API and WebSocket on its own host", () => {
    const e = resolveEndpoints(withMainnet({ rpcUrl: "https://api.nodexch.space/" }));
    expect(e.provider).toBe("nodexch");
    expect(e.isCoinset).toBe(false);
    expect(e.rpcUrl).toBe("https://api.nodexch.space");
    expect(e.indexedUrl).toBe("https://api.nodexch.space");
    // The site's own key (handed over by the server at run time) rides in the socket URL.
    const key = NETWORKS.mainnet.nodexchKey;
    expect(e.wsUrl).toBe(
      key ? `wss://api.nodexch.space/ws?key=${key}` : "wss://api.nodexch.space/ws"
    );
  });

  test("a self-hosted gateway is nodexch when marked, and its key rides in the socket URL", () => {
    const e = resolveEndpoints(
      withMainnet({ rpcUrl: "http://localhost:8600", provider: "nodexch", apiKey: PUBLISHABLE })
    );
    expect(e.provider).toBe("nodexch");
    expect(e.apiKey).toBe(PUBLISHABLE);
    expect(e.wsUrl).toBe(`ws://localhost:8600/ws?key=${PUBLISHABLE}`);
    const unmarked = resolveEndpoints(withMainnet({ rpcUrl: "http://localhost:8600" }));
    expect(unmarked.provider).toBe("custom");
    expect(unmarked.indexedUrl).toBeNull();
    expect(unmarked.wsUrl).toBeNull();
  });

  test("only a publishable key is kept; a secret key never is", () => {
    const secret = withMainnet({
      rpcUrl: "https://api.nodexch.space",
      apiKey: "nxs_Zk3vQ0aBq1v0m3J2o0r8c5Tt",
    });
    expect(secret.endpoints.mainnet.apiKey).toBeUndefined();
    const kept = withMainnet({ rpcUrl: "https://api.nodexch.space", apiKey: ` ${PUBLISHABLE} ` });
    expect(kept.endpoints.mainnet.apiKey).toBe(PUBLISHABLE);
  });

  test("Coinset stays Coinset whatever is declared", () => {
    const e = resolveEndpoints(
      withMainnet({ rpcUrl: "https://api.coinset.org", provider: "nodexch" })
    );
    expect(e.provider).toBe("coinset");
    expect(e.isCoinset).toBe(true);
    expect(e.apiKey).toBeNull();
  });
});

describe("networkFromSearch", () => {
  test("reads the network a link names, and nothing else", () => {
    expect(networkFromSearch("?network=testnet11")).toBe("testnet11");
    expect(networkFromSearch("?id=1&network=mainnet")).toBe("mainnet");
    expect(networkFromSearch("")).toBeNull();
    expect(networkFromSearch("?network=devnet")).toBeNull();
  });
});
