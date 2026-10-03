import { describe, expect, test } from "bun:test";
import { NETWORKS } from "./networks";
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
