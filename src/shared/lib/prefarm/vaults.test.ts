import { describe, expect, test } from "bun:test";
import { puzzleHashToAddress } from "@/shared/lib/chia/address";
import { PREFARM_VAULTS, summariseVault } from "./vaults";

describe("prefarm vaults", () => {
  test("the four official launchers and their addresses are well formed", () => {
    expect(PREFARM_VAULTS.map((v) => v.id)).toEqual(["cold-us", "cold-ch", "warm-us", "warm-ch"]);
    for (const v of PREFARM_VAULTS) {
      expect(v.launcherId).toMatch(/^[0-9a-f]{64}$/);
      for (const ph of v.puzzleHashes) expect(ph).toMatch(/^[0-9a-f]{64}$/);
    }
    // The US cold vault's launcher and p2 address as printed in Chia's prefarm audit guide.
    const coldUs = PREFARM_VAULTS[0]!;
    expect(coldUs.launcherId).toBe(
      "6c77dce3c3bab525dab7883e8ad513a8f3ff127e872009b12836cbb1c8f26647"
    );
    expect(puzzleHashToAddress(coldUs.puzzleHashes[1]!, "xch")).toBe(
      "xch1jj0gm4ahhlu3ke0r0fx955v8axr6za7rzz6hc0y26lewa7zw6fws5nwvv6"
    );
  });

  test("a vault balance counts each coin once and the singleton coin only when it is not among them", () => {
    const vault = PREFARM_VAULTS[1]!;
    const coins = [
      {
        name: "a",
        puzzleHash: vault.puzzleHashes[0]!,
        amount: 100n,
        confirmedHeight: 10,
        timestamp: 1_000,
      },
      {
        name: "a",
        puzzleHash: vault.puzzleHashes[0]!,
        amount: 100n,
        confirmedHeight: 10,
        timestamp: 1_000,
      },
      {
        name: "b",
        puzzleHash: vault.puzzleHashes[1]!,
        amount: 5n,
        confirmedHeight: 12,
        timestamp: 1_200,
      },
    ];
    const counted = summariseVault(
      vault,
      { amount: 100n, puzzleHash: vault.puzzleHashes[0]!, height: 10 },
      coins,
      "a"
    );
    expect(counted.total).toBe(105n);
    expect(counted.coins).toHaveLength(2);
    expect(counted.lastActivityHeight).toBe(12);
    const separate = summariseVault(
      vault,
      { amount: 1n, puzzleHash: "ff", height: 9 },
      coins,
      "zz"
    );
    expect(separate.total).toBe(106n);
    expect(summariseVault(vault, null, [], null).total).toBe(0n);
  });
});
