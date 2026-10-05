import { describe, expect, test } from "bun:test";
import sample from "@/test-utils/fixtures/kind_sample.json";
import { normaliseMempoolItem } from "@/shared/lib/rpc/normalise";
import { classifyMempoolItem } from "./classify";

/**
 * 50 confirmed mainnet transactions recorded 2026-09-16 (blocks around the peak, at most 15
 * plain XCH transfers to keep the mix), with the kind Coinset derives from its coin types.
 * Coinset labels plot-NFT pool claims as XCH+SINGLETON; we call them "pool".
 */
describe("heuristic kinds against Coinset coin types", () => {
  const rows = (
    sample as { rows: { item: unknown; coinsetKind: string; coinsetTypes: string[] }[] }
  ).rows;
  test("mismatch rate stays below 10% on the recorded sample", () => {
    const results = rows.map((r) => {
      const ours = classifyMempoolItem(normaliseMempoolItem(r.item)).kind;
      const expected =
        r.coinsetTypes.includes("SINGLETON") &&
        !r.coinsetTypes.includes("NFT") &&
        !r.coinsetTypes.includes("DID")
          ? ["pool", "singleton"]
          : [r.coinsetKind];
      return { ours, expected, ok: expected.includes(ours) };
    });
    const mismatches = results.filter((r) => !r.ok);
    expect(rows.length).toBe(50);
    expect(mismatches.length / rows.length).toBeLessThan(0.1);
    const counts = results.reduce(
      (a, r) => ({ ...a, [r.ours]: (a[r.ours] ?? 0) + 1 }),
      {} as Record<string, number>
    );
    expect(counts.cat).toBeGreaterThanOrEqual(6);
    expect(counts.pool).toBeGreaterThanOrEqual(20);
  });
});
