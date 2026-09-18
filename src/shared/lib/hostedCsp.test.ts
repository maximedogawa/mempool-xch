import { describe, expect, test } from "bun:test";
// The CSP builder lives with the Sage scripts it was written for; bun's test root is src/, so its test lives here.
import { buildAppCsp, buildEmbedCsp, buildHostedAppCsp } from "../../../scripts/sage/csp";

const sources = (csp: string, name: string) => (csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "").split(" ").slice(1);

describe("hosted app CSP", () => {
  const csp = buildHostedAppCsp();

  test("connects to any https/wss node and a localhost proxy, but to nothing else over plain http", () => {
    const connect = sources(csp, "connect-src");
    for (const s of ["'self'", "https:", "wss:", "http://localhost:*", "ws://127.0.0.1:*"]) expect(connect).toContain(s);
    expect(connect).not.toContain("http:");
    expect(connect).not.toContain("*");
  });

  test("images load only from the trusted asset hosts, never from any https origin", () => {
    const img = sources(csp, "img-src");
    expect(img).toContain("https://icons.dexie.space");
    expect(img).not.toContain("https:");
    expect(img.some((s) => s.includes("localhost"))).toBe(false);
  });

  test("keeps the lockdown directives and drops the one Chrome rejects", () => {
    for (const d of ["default-src 'self'", "object-src 'none'", "base-uri 'none'", "frame-ancestors 'self'", "form-action 'none'"]) expect(csp).toContain(d);
    expect(csp).not.toContain("prefetch-src");
  });

  test("the Sage policy is unchanged: no inline scripts, prefetch-src kept", () => {
    const sage = buildAppCsp(["https://api.coinset.org"]);
    expect(sources(sage, "script-src")).toEqual(["'self'", "'wasm-unsafe-eval'"]);
    expect(sage).toContain("prefetch-src 'none'");
  });
});

describe("buildEmbedCsp", () => {
  test("only the embeds allow any frame ancestor; everything else is unchanged", () => {
    const embed = buildEmbedCsp();
    expect(embed).toContain("frame-ancestors *");
    expect(embed.replace("frame-ancestors *", "frame-ancestors 'self'")).toBe(buildHostedAppCsp());
  });
});
