import { describe, expect, test } from "bun:test";
import { needsNodexchKey } from "./networks";

describe("needsNodexchKey", () => {
  test("names the gateway on nodexch.com", () => {
    expect(needsNodexchKey("https://api.nodexch.com")).toBe(true);
  });

  test("not another host, and not a malformed address", () => {
    expect(needsNodexchKey("https://api.coinset.org")).toBe(false);
    expect(needsNodexchKey("https://example.com")).toBe(false);
    expect(needsNodexchKey("not a url")).toBe(false);
  });
});
