import { describe, expect, test } from "bun:test";
import rawCat from "@/test-utils/fixtures/raw_tx_cat.json";
import rawNft from "@/test-utils/fixtures/raw_tx_nft.json";
import rawXch from "@/test-utils/fixtures/raw_tx_xch.json";
import summaryCat from "@/test-utils/fixtures/summary_tx_cat.json";
import summaryNft from "@/test-utils/fixtures/summary_tx_nft.json";
import summaryXch from "@/test-utils/fixtures/summary_tx_xch.json";
import { normaliseMempoolItem, normaliseTxSummary } from "@/shared/lib/rpc/normalise";
import { assetTotalsFromSpends, assetTotalsFromSummaries } from "./assetTotals";

describe("block asset totals", () => {
  const txs = [summaryXch, summaryCat, summaryNft].map((s) => normaliseTxSummary(s.transaction));
  test("Coinset summaries: net XCH that changed hands, CAT per asset, NFT count", () => {
    const t = assetTotalsFromSummaries(txs);
    // XCH tx: 0x1365… received 114,150,535,534 net; the sender's change does not count.
    // CAT tx: 0x9a27… received 10,384,693,892 net.
    expect(BigInt(t.xch)).toBe(114_150_535_534n + 10_384_693_892n);
    expect(t.cats).toEqual([
      {
        assetId: "00000000024e1fb9fc47c7ec72854c6a987c4cc99f6535a4caca6154220eeda5",
        amount: "1234",
      },
    ]);
    expect(t.nfts).toBeGreaterThanOrEqual(1);
    expect(t.count).toBe(3);
    expect(t.source).toBe("coinset");
  });
  test("RPC fallback: gross spent per kind from the block's coin spends", () => {
    const spends = [rawXch, rawCat, rawNft].flatMap(
      (r) => normaliseMempoolItem(r.item).spendBundle.coinSpends
    );
    const t = assetTotalsFromSpends(spends);
    expect(t.source).toBe("rpc");
    expect(t.cats[0]!.amount).toBe("1234");
    expect(t.nfts).toBeGreaterThanOrEqual(1);
    // Gross: includes change, so it is larger than the net Coinset figure.
    expect(BigInt(t.xch)).toBeGreaterThan(114_150_535_534n + 10_384_693_892n);
    expect(t.count).toBe(spends.length);
  });
});
