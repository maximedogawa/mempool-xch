import { describe, expect, test } from "bun:test";
import fee6 from "@/test-utils/fixtures/fee_estimate_cost_6000000.json";
import fee10 from "@/test-utils/fixtures/fee_estimate_cost_10000000.json";
import fullBlockTx from "@/test-utils/fixtures/full_block_tx.json";
import summaryXch from "@/test-utils/fixtures/summary_tx_xch.json";
import blockchainState from "@/test-utils/fixtures/blockchain_state.json";
import { CHIA } from "@/shared/config/networks";
import { feePerCost } from "@/shared/lib/chia/amounts";
import { normaliseBlockchainState, normaliseFeeEstimate, normaliseFullBlock, normaliseTxSummary } from "@/shared/lib/rpc/normalise";

/**
 * Fee and cost semantics, cross-checked against chia-blockchain (full_node_rpc_api.py,
 * mempool_manager.py, mempool.py on main, 2026-09-16) and recorded Coinset responses.
 */
describe("fee figures", () => {
  test("get_fee_estimate.estimates are fee rate × requested cost, so estimate / cost is the rate", () => {
    const a = normaliseFeeEstimate(fee6);
    const b = normaliseFeeEstimate(fee10);
    a.estimates.forEach((est, i) => {
      const rateA = Number(est) / 6_000_000;
      const rateB = Number(b.estimates[i]) / 10_000_000;
      expect(rateA).toBeCloseTo(rateB, 6);
    });
    // The 1-minute estimate equals the estimator's current rate (time offset 1 s vs 60 s here agree).
    expect(Number(a.estimates[0]) / 6_000_000).toBeCloseTo(a.currentFeeRate, 6);
    // What the fee cards display for the reference cost.
    expect(Number(a.estimates[0]) / CHIA.REFERENCE_SPEND_COST).toBeCloseTo(0.3737, 3);
  });

  test("mempool_size in get_fee_estimate is a cost, not a count", () => {
    const f = normaliseFeeEstimate(fee6);
    expect(f.mempoolCost).toBeGreaterThan(1_000_000_000);
    expect(f.mempoolMaxCost).toBe(110_000_000_000);
    expect(f.numSpends).toBeLessThan(10_000);
  });

  test("mempool_min_fees.cost_5000000 is used as a rate (mojos per cost)", () => {
    const state = normaliseBlockchainState({ ...blockchainState.blockchain_state, mempool_min_fees: { cost_5000000: 7.5 } });
    // Same read useMempoolSummary() does (src/shared/api/hooks.ts) when assembling the summary client-side.
    expect(state.mempoolMinFees.cost_5000000 ?? 0).toBe(7.5);
  });

  test("fee per cost of a confirmed transaction matches Coinset fee_mojos / cost", () => {
    const tx = normaliseTxSummary(summaryXch.transaction);
    expect(feePerCost(tx.feeMojos, tx.cost)).toBeCloseTo(Number(tx.feeMojos) / tx.cost, 9);
    expect(feePerCost(604585170n, 80587336)).toBeCloseTo(7.5, 1);
  });

  test("block cost is the compressed generator cost, at or below the sum of item costs, within block_max_cost", () => {
    const block = normaliseFullBlock(fullBlockTx.block);
    const tx = normaliseTxSummary(summaryXch.transaction);
    expect(block.cost).toBeGreaterThan(0);
    expect(block.cost).toBeLessThanOrEqual(tx.cost);
    expect(block.cost).toBeLessThanOrEqual(CHIA.BLOCK_MAX_COST);
    expect(block.fees).toBe(tx.feeMojos);
    const state = normaliseBlockchainState(blockchainState.blockchain_state);
    expect(state.blockMaxCost).toBe(CHIA.BLOCK_MAX_COST);
    expect(state.mempoolMaxTotalCost).toBe(CHIA.BLOCK_MAX_COST * 10);
  });
});

import rawFee1 from "@/test-utils/fixtures/raw_tx_fee1.json";
import rawFee2 from "@/test-utils/fixtures/raw_tx_fee2.json";
import rawFee3 from "@/test-utils/fixtures/raw_tx_fee3.json";
import rawFee4 from "@/test-utils/fixtures/raw_tx_fee4.json";
import rawCat from "@/test-utils/fixtures/raw_tx_cat.json";
import rawXch from "@/test-utils/fixtures/raw_tx_xch.json";
import summaryFee1 from "@/test-utils/fixtures/summary_tx_fee1.json";
import summaryFee2 from "@/test-utils/fixtures/summary_tx_fee2.json";
import summaryFee3 from "@/test-utils/fixtures/summary_tx_fee3.json";
import summaryFee4 from "@/test-utils/fixtures/summary_tx_fee4.json";
import summaryCat from "@/test-utils/fixtures/summary_tx_cat.json";
import { normaliseMempoolItem } from "@/shared/lib/rpc/normalise";
import { compactMempoolItem } from "@/shared/lib/mempool/compact";

describe("our fee per cost against Coinset for confirmed transactions", () => {
  const pairs = [
    [rawFee1, summaryFee1],
    [rawFee2, summaryFee2],
    [rawFee3, summaryFee3],
    [rawFee4, summaryFee4],
    [rawCat, summaryCat],
    [rawXch, summaryXch],
  ] as const;
  test("six recorded transactions: fee, cost and fee per cost match", () => {
    pairs.forEach(([raw, summary]) => {
      const item = compactMempoolItem(normaliseMempoolItem((raw as { item: unknown }).item), 0);
      const tx = normaliseTxSummary((summary as { transaction: unknown }).transaction);
      expect(item.id).toBe(tx.id);
      expect(BigInt(item.fee)).toBe(tx.feeMojos);
      expect(item.cost).toBe(tx.cost);
      expect(item.feeRate).toBeCloseTo(Number(tx.feeMojos) / tx.cost, 9);
    });
    expect(pairs.length).toBeGreaterThanOrEqual(5);
  });
});
