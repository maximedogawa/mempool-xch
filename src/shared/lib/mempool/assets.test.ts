import { describe, expect, test } from "bun:test";
import rawCat from "@/test-utils/fixtures/raw_tx_cat.json";
import rawNft from "@/test-utils/fixtures/raw_tx_nft.json";
import rawXch from "@/test-utils/fixtures/raw_tx_xch.json";
import summaryCat from "@/test-utils/fixtures/summary_tx_cat.json";
import summaryXch from "@/test-utils/fixtures/summary_tx_xch.json";
import { normaliseMempoolItem, normaliseTxSummary } from "@/shared/lib/rpc/normalise";
import { formatAssets, formatPrimaryAsset, primaryAsset } from "./assets";
import { classifyCoinSpend } from "./classify";
import { bundleAssets, compactMempoolItem } from "./compact";

/** Sum of what Coinset says every participant sent, per asset. */
function sentTotals(summary: ReturnType<typeof normaliseTxSummary>) {
  let xch = 0n;
  const cats = new Map<string, bigint>();
  summary.events.forEach((e) =>
    e.participants.forEach((p) => {
      xch += p.sent.xch;
      p.sent.cats.forEach((c) => cats.set(c.assetId, (cats.get(c.assetId) ?? 0n) + c.amount));
    })
  );
  return { xch, cats };
}

describe("per-asset bundle totals against Coinset summaries", () => {
  test("CAT transfer: CAT mojos per asset id and the XCH spent match Coinset", () => {
    const item = normaliseMempoolItem(rawCat.item);
    const assets = bundleAssets(item);
    const coinset = sentTotals(normaliseTxSummary(summaryCat.transaction));
    expect(assets.cats.length).toBe(1);
    expect(assets.cats[0]!.assetId).toBe("00000000024e1fb9fc47c7ec72854c6a987c4cc99f6535a4caca6154220eeda5");
    expect(BigInt(assets.cats[0]!.amount)).toBe(coinset.cats.get("00000000024e1fb9fc47c7ec72854c6a987c4cc99f6535a4caca6154220eeda5") ?? -1n);
    expect(BigInt(assets.xch)).toBe(coinset.xch);
    const primary = primaryAsset(assets, "cat");
    expect(primary.kind).toBe("cat");
    expect(formatPrimaryAsset(primary, "0000")).toBe("1.234 0000");
    expect(formatAssets(assets, {})).toBe("1.234 CAT + 0.010389 XCH");
  });

  test("XCH transfer: everything is XCH and matches Coinset", () => {
    const item = normaliseMempoolItem(rawXch.item);
    const assets = bundleAssets(item);
    const coinset = sentTotals(normaliseTxSummary(summaryXch.transaction));
    expect(assets.cats).toEqual([]);
    expect(assets.nfts).toBe(0);
    expect(BigInt(assets.xch)).toBe(coinset.xch);
    expect(formatPrimaryAsset(primaryAsset(assets))).toBe("666.7653 XCH");
  });

  test("NFT mint: the NFT coin is counted, not summed as XCH", () => {
    const item = normaliseMempoolItem(rawNft.item);
    const kinds = item.spendBundle.coinSpends.map((s) => classifyCoinSpend(s).kind);
    expect(kinds).toContain("nft");
    const assets = bundleAssets(item);
    expect(assets.nfts).toBeGreaterThanOrEqual(1);
    const nftMojos = item.spendBundle.coinSpends.filter((s) => classifyCoinSpend(s).kind === "nft").reduce((a, s) => a + s.coin.amount, 0n);
    expect(BigInt(assets.xch) + nftMojos).toBe(item.removals.reduce((a, c) => a + c.amount, 0n) - item.spendBundle.coinSpends.filter((s) => ["did", "singleton", "cat"].includes(classifyCoinSpend(s).kind)).reduce((a, s) => a + s.coin.amount, 0n));
    expect(primaryAsset(assets, "nft").kind).toBe("nft");
    expect(formatPrimaryAsset(primaryAsset(assets, "nft"))).toMatch(/^\d+ NFTs?$/);
  });

  test("compact item carries the assets and no mixed value", () => {
    const compact = compactMempoolItem(normaliseMempoolItem(rawCat.item), 1);
    expect(compact.assets.cats[0]!.amount).toBe("1234");
    expect("value" in compact).toBe(false);
    expect(compact.kind).toBe("cat");
  });
});
