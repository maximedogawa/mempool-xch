import { describe, expect, test } from "bun:test";
import { isSageRuntime, mapSageNetwork, mapSageTheme, receiveAddressFrom } from "./mappers";

describe("sage mappers", () => {
  test("detects the host synchronously", () => {
    expect(isSageRuntime({})).toBe(false);
    expect(isSageRuntime(undefined)).toBe(false);
    expect(isSageRuntime({ __TAURI__: {} })).toBe(true);
    expect(isSageRuntime({ __SAGE__: {} })).toBe(true);
  });
  test("maps networks", () => {
    expect(mapSageNetwork({ kind: "mainnet", networkId: "mainnet" })).toBe("mainnet");
    expect(mapSageNetwork({ kind: "testnet", networkId: "testnet11" })).toBe("testnet11");
    expect(mapSageNetwork({ kind: "unknown", networkId: "testnet11" })).toBe("testnet11");
    expect(mapSageNetwork({ kind: "unknown", prefix: "txch" })).toBe("testnet11");
    expect(mapSageNetwork({ kind: "unknown", name: "simulator0" })).toBe("mainnet");
  });
  test("maps themes", () => {
    expect(mapSageTheme({ name: "light", displayName: "Light" })).toBe("light");
    expect(mapSageTheme({ name: "sage", displayName: "Sage", mostLike: "dark" })).toBe("dark");
    expect(mapSageTheme({ name: "custom", inherits: "light" })).toBe("light");
    expect(mapSageTheme({ name: "midnight", displayName: "Midnight" })).toBe("dark");
  });
  test("extracts the receive address", () => {
    const addr = `xch1${"q".repeat(58)}`;
    expect(receiveAddressFrom({ receive_address: addr })).toBe(addr);
    expect(receiveAddressFrom({ receive_address: "nope" })).toBeNull();
    expect(receiveAddressFrom(null)).toBeNull();
  });
});
