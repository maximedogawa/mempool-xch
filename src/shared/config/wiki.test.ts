import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";
import { WIKI_BASE, WIKI_PAGES, wikiUrl } from "./wiki";

const ROOT = join(import.meta.dir, "..", "..", "..");
const WIKI = join(ROOT, "wiki");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

/** Repositories visitors cannot open: linking them from the public wiki sends them to a 404. */
const PRIVATE_REPOS =
  /github\.com\/maximedogawa\/(mempool-xch-wiki|mempool-xch-backlog|nodexch[\w-]*|pengui[\w-]*)/;

describe("public wiki", () => {
  test("every page the app links to exists in wiki/", () => {
    for (const page of Object.values(WIKI_PAGES)) expect(existsSync(join(WIKI, page))).toBe(true);
  });

  test("links point at the public repository", () => {
    expect(WIKI_BASE).toBe("https://github.com/maximedogawa/mempool-xch/blob/main/wiki");
    expect(wikiUrl("customNode", "built-in-dev-proxy")).toBe(
      `${WIKI_BASE}/guides/custom-node.md#built-in-dev-proxy`
    );
  });

  test("relative links inside wiki/ resolve", () => {
    const broken: string[] = [];
    for (const file of files(WIKI).filter((f) => f.endsWith(".md"))) {
      for (const [, link] of readFileSync(file, "utf8").matchAll(/\]\(([^)\s]+)\)/g)) {
        if (/^(https?:|mailto:|#)/.test(link!)) continue;
        const target = normalize(join(dirname(file), link!.split("#")[0]!));
        if (!existsSync(target)) broken.push(`${relative(ROOT, file)} → ${link}`);
      }
    }
    expect(broken).toEqual([]);
  });

  test("wiki/ links no private repository", () => {
    const offenders = files(WIKI)
      .filter((f) => f.endsWith(".md"))
      .filter((f) => PRIVATE_REPOS.test(readFileSync(f, "utf8")))
      .map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  test("the app never links the private wiki repository", () => {
    const offenders = files(join(ROOT, "src"))
      .filter((f) => /\.(tsx?|json)$/.test(f) && !f.endsWith("wiki.test.ts"))
      .filter((f) => readFileSync(f, "utf8").includes("github.com/maximedogawa/mempool-xch-wiki"))
      .map((f) => relative(ROOT, f));
    expect(offenders).toEqual([]);
  });
});
