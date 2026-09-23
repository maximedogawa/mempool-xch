import { describe, expect, test } from "bun:test";
// The budget script lives with the other perf scripts; bun's test root is src/, so its test lives here.
import { scriptChunks } from "../../../scripts/perf/js-budget";

describe("initial JS budget", () => {
  test("reads each script chunk a prerendered page references once", () => {
    const html =
      '<script src="/_next/static/chunks/a1.js" async></script>' +
      '<link rel="preload" href="/_next/static/chunks/b2.js"/>' +
      '<script src="/_next/static/chunks/a1.js"></script>' +
      '<link rel="stylesheet" href="/_next/static/chunks/c3.css"/>';
    expect(scriptChunks(html)).toEqual(["a1.js", "b2.js"]);
  });
});
