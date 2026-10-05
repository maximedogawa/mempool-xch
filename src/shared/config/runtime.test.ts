import { describe, expect, test } from "bun:test";
import { NETWORKS, defaultEndpointUrl, fallbackEndpointUrl, providerOf } from "./networks";
import { runtimeConfigFromEnv, runtimeConfigScript, runtimeNodexchKey } from "./runtime";

const KEY = "nxp_Zk3vQ0aBq1v0m3J2o0r8c5Tt";

describe("runtime config", () => {
  test("the server exposes publishable keys from its environment, and nothing else", () => {
    expect(runtimeConfigFromEnv({})).toEqual({ nodexchKeys: {} });
    expect(
      runtimeConfigFromEnv({ NODEXCH_KEY_MAINNET: ` ${KEY} `, NODEXCH_KEY_TESTNET11: "" })
    ).toEqual({ nodexchKeys: { mainnet: KEY } });
    // A secret key, or anything that could break out of the script, never leaves the server.
    expect(
      runtimeConfigFromEnv({
        NODEXCH_KEY_MAINNET: "nxs_Zk3vQ0aBq1v0m3J2o0r8c5Tt",
        NODEXCH_KEY_TESTNET11: 'nxp_Zk3vQ0aBq1v0m3J2";alert(1)//',
        MEMPOOL_RPC_KEY_MAINNET: KEY,
      })
    ).toEqual({ nodexchKeys: {} });
  });

  test("the main API and its fallback: https URLs only, plain http for a local node", () => {
    expect(
      runtimeConfigFromEnv({
        API_URL_MAINNET: " https://gw.example.test/ ",
        API_FALLBACK_URL_MAINNET: "https://api.coinset.org",
      })
    ).toEqual({
      nodexchKeys: {},
      apiUrl: "https://gw.example.test",
      fallbackUrl: "https://api.coinset.org",
    });
    expect(runtimeConfigFromEnv({ API_URL_MAINNET: "http://localhost:8600" }).apiUrl).toBe(
      "http://localhost:8600"
    );
    for (const bad of [
      "http://gw.example.test",
      "javascript:alert(1)",
      "https://user:pass@gw.example.test",
      "https://gw.example.test/?key=1",
      "not a url",
    ]) {
      expect(runtimeConfigFromEnv({ API_URL_MAINNET: bad, API_FALLBACK_URL_MAINNET: bad })).toEqual(
        {
          nodexchKeys: {},
        }
      );
    }
    // A fallback that is the main API is no fallback.
    expect(
      runtimeConfigFromEnv({
        API_URL_MAINNET: "https://gw.example.test",
        API_FALLBACK_URL_MAINNET: "https://gw.example.test/",
      }).fallbackUrl
    ).toBeUndefined();
  });

  test("the browser reads the main API and the fallback the server named", () => {
    const run = (config: Parameters<typeof runtimeConfigScript>[0]) =>
      new Function(runtimeConfigScript(config))();
    const key = NETWORKS.mainnet.nodexchKey;
    try {
      // Another gateway than nodexch.space: the site's default, with no key asked for.
      run({
        nodexchKeys: {},
        apiUrl: "https://gw.example.test",
        fallbackUrl: "https://api.coinset.org",
      });
      expect(NETWORKS.mainnet.nodexchUrl).toBe("https://gw.example.test");
      expect(defaultEndpointUrl("mainnet")).toBe("https://gw.example.test");
      expect(providerOf("mainnet", "https://gw.example.test")).toBe("nodexch");
      expect(fallbackEndpointUrl("mainnet")).toBe("https://api.coinset.org");
      expect(fallbackEndpointUrl("testnet11")).toBeNull();
      expect(defaultEndpointUrl("testnet11")).toBe("https://testnet11.api.coinset.org");
      // Coinset as the main API: the default, whatever key there is.
      run({ nodexchKeys: { mainnet: KEY }, apiUrl: "https://api.coinset.org" });
      expect(defaultEndpointUrl("mainnet")).toBe("https://api.coinset.org");
      expect(NETWORKS.mainnet.nodexchUrl).toBe("https://api.nodexch.space");
      expect(fallbackEndpointUrl("mainnet")).toBeNull();
      // nodexch.space named without its key: Coinset, since it would refuse every request.
      run({ nodexchKeys: {}, apiUrl: "https://api.nodexch.space" });
      expect(defaultEndpointUrl("mainnet")).toBe("https://api.coinset.org");
    } finally {
      run({ nodexchKeys: { mainnet: key } });
    }
  });

  test("the script hands the keys to the browser, where the networks read them", () => {
    const before = NETWORKS.mainnet.nodexchKey;
    try {
      new Function(runtimeConfigScript({ nodexchKeys: { mainnet: KEY } }))();
      expect(runtimeNodexchKey("mainnet")).toBe(KEY);
      expect(NETWORKS.mainnet.nodexchKey).toBe(KEY);
      expect(NETWORKS.testnet11.nodexchKey).toBe("");
      // Without the script (the Sage export) every key is empty.
      new Function(runtimeConfigScript({ nodexchKeys: {} }))();
      expect(NETWORKS.mainnet.nodexchKey).toBe("");
    } finally {
      new Function(runtimeConfigScript({ nodexchKeys: { mainnet: before } }))();
    }
  });
});
