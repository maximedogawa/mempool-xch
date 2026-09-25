import { describe, expect, test } from "bun:test";
import { badgeSource } from "./source";

describe("badgeSource", () => {
  test("Coinset without settings", () => {
    expect(badgeSource("mainnet", {})).toEqual({ url: "https://api.coinset.org", key: null });
    expect(badgeSource("testnet11", {})).toEqual({
      url: "https://testnet11.api.coinset.org",
      key: null,
    });
  });

  test("a nodexch gateway and its key per network", () => {
    const env = {
      MEMPOOL_RPC_URL_MAINNET: "https://nodexch.space/ ",
      MEMPOOL_RPC_KEY_MAINNET: "nxs_secret",
    };
    expect(badgeSource("mainnet", env)).toEqual({
      url: "https://nodexch.space",
      key: "nxs_secret",
    });
    expect(badgeSource("testnet11", env).url).toBe("https://testnet11.api.coinset.org");
  });

  test("empty values fall back to Coinset", () => {
    expect(
      badgeSource("mainnet", { MEMPOOL_RPC_URL_MAINNET: " ", MEMPOOL_RPC_KEY_MAINNET: "" })
    ).toEqual({
      url: "https://api.coinset.org",
      key: null,
    });
  });
});
