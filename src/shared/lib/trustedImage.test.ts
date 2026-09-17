import { describe, expect, test } from "bun:test";
import { isHttpsUrl, isTrustedImageUrl } from "./trustedImage";

describe("isTrustedImageUrl", () => {
  test.each([
    ["https://icons.dexie.space/abcdef.webp", true],
    ["https://assets.mainnet.mintgarden.io/thumbnails/abc.webp", true],
    ["https://ipfs.mintgarden.io/ipfs/bafy.../image.png", true],
  ])("accepts a trusted host: %s", (url, expected) => {
    expect(isTrustedImageUrl(url)).toBe(expected);
  });

  test.each([
    ["http://icons.dexie.space/abcdef.webp", "plain http on an otherwise trusted host"],
    ["https://evil.example.com/steal.png", "an untrusted host"],
    ["https://icons.dexie.space.evil.com/x.png", "a lookalike host"],
    ["not a url", "garbage input"],
    ["", "empty string"],
    ["javascript:alert(1)", "a non-http(s) scheme"],
  ])("rejects %s", (url) => {
    expect(isTrustedImageUrl(url)).toBe(false);
  });
});

describe("isHttpsUrl", () => {
  test("accepts any https URL", () => {
    expect(isHttpsUrl("https://some-wallet-provided-host.example/icon.png")).toBe(true);
  });

  test.each([
    ["http://example.com/icon.png", "plain http"],
    ["not a url", "garbage input"],
    ["javascript:alert(1)", "a non-http(s) scheme"],
  ])("rejects %s", (url) => {
    expect(isHttpsUrl(url)).toBe(false);
  });
});
