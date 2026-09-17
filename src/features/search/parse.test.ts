import { describe, expect, test } from "bun:test";
import { launcherIdToDidId, launcherIdToNftId, puzzleHashToAddress } from "@/shared/lib/chia/address";
import { parseSearchInput } from "./parse";

const ph = "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4";

describe("parseSearchInput", () => {
  test("heights", () => {
    expect(parseSearchInput(" 9295514 ")).toEqual({ kind: "height", height: 9295514 });
    expect(parseSearchInput("0")).toEqual({ kind: "height", height: 0 });
  });
  test("addresses on both networks", () => {
    const xch = puzzleHashToAddress(ph, "xch");
    const txch = puzzleHashToAddress(ph, "txch");
    expect(parseSearchInput(xch.toUpperCase())).toMatchObject({ kind: "address", puzzleHash: ph, prefix: "xch" });
    expect(parseSearchInput(txch)).toMatchObject({ kind: "address", puzzleHash: ph, prefix: "txch" });
    expect(parseSearchInput(`${xch.slice(0, -2)}zz`).kind).toBe("invalid");
  });
  test("nft and did ids", () => {
    const launcher = "ab".repeat(32);
    expect(parseSearchInput(launcherIdToNftId(launcher))).toMatchObject({ kind: "nft", launcherId: launcher });
    expect(parseSearchInput(launcherIdToDidId(launcher))).toMatchObject({ kind: "did", launcherId: launcher });
    expect(parseSearchInput("nft1broken").kind).toBe("invalid");
  });
  test("32-byte hex is ambiguous", () => {
    expect(parseSearchInput(`0x${ph}`)).toEqual({ kind: "hex32", hex: ph });
    expect(parseSearchInput(ph.toUpperCase())).toEqual({ kind: "hex32", hex: ph });
    expect(parseSearchInput("abcd").kind).toBe("invalid");
    expect(parseSearchInput("").kind).toBe("invalid");
  });
  test("free text that matches no known shape is a name search, not an error", () => {
    expect(parseSearchInput("hello world")).toEqual({ kind: "text", value: "hello world" });
    expect(parseSearchInput("Chia Friends")).toEqual({ kind: "text", value: "Chia Friends" });
  });
});
