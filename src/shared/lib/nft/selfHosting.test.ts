import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { TRUSTED_IMAGE_HOSTS, isTrustedImageUrl } from "@/shared/lib/trustedImage";

/**
 * This site must never host, proxy or cache third-party NFT or token media: it points the
 * browser at the source and nothing more. These are the structural guards for that, so the rule
 * survives a future refactor that would otherwise quietly reintroduce an origin-served copy.
 */

const read = (path: string) =>
  readFileSync(new URL(`../../../../${path}`, import.meta.url), "utf8");

test("every trusted media host is third-party, never this site", () => {
  expect(TRUSTED_IMAGE_HOSTS.size).toBeGreaterThan(0);
  for (const host of TRUSTED_IMAGE_HOSTS) {
    expect(host).not.toMatch(/mempoolxch|localhost/);
  }
  // A same-origin or relative URL is never treated as trusted asset media.
  expect(isTrustedImageUrl("https://mempoolxch.space/cached/nft.webp")).toBe(false);
  expect(isTrustedImageUrl("/api/image?url=https://ipfs.mintgarden.io/x.png")).toBe(false);
});

test("next/image stays banned and its optimiser stays off", () => {
  // next/image would fetch remote artwork and re-serve the bytes from /_next/image on our origin.
  expect(read("eslint.config.mjs")).toContain('name: "next/image"');
  expect(read("next.config.ts")).toContain("images: { unoptimized: true }");
});

test("no component imports next/image, and nothing caches media in a worker", () => {
  const sources = new Bun.Glob("src/**/*.{ts,tsx}").scanSync(
    new URL("../../../../", import.meta.url).pathname
  );
  for (const file of sources) {
    if (file.endsWith("selfHosting.test.ts")) continue;
    const body = read(file);
    expect(body).not.toMatch(/from\s+["']next\/image["']/);
    expect(body).not.toMatch(/caches\.open|serviceWorker\.register/);
  }
});
