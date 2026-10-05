import { describe, expect, test } from "bun:test";
import { parseJsonSafe } from "@/shared/lib/rpc/json";
import {
  blockTotalsFromFrame,
  feeEstimateFromQuote,
  parseDashboard,
  parseFeeQuote,
} from "./dashboard";

const HASH = `0x${"ab".repeat(32)}`;
const CAT = `0x${"cc".repeat(32)}`;

/** A dashboard answer as the gateway's conformance frames shape it (nodexch TASK-152). */
const DASHBOARD = `{
  "blockchain_state": {
    "peak": {"height": 8412345, "header_hash": "${HASH}", "prev_hash": "0x00", "weight": 36893488147419103232, "total_iters": 1, "timestamp": 1790480000, "fees": 5, "farmer_puzzle_hash": "0x01", "pool_puzzle_hash": "0x02", "prev_transaction_block_height": 8412340},
    "space": 36893488147419103232000, "difficulty": 15000, "sub_slot_iters": 1, "average_block_time": 18.75,
    "block_max_cost": 11000000000, "mempool_size": 2, "mempool_cost": 24000000, "mempool_fees": 50000001,
    "mempool_max_total_cost": 110000000000, "mempool_min_fees": {"cost_5000000": 0}, "sync": {"synced": true, "sync_mode": false},
    "node_id": "0x0f"
  },
  "fees": {"estimates": [{"blocks": 1, "fee_per_cost": 3.0, "fee_for_typical_cost": 15000000}, {"blocks": 3, "fee_per_cost": 1.0, "fee_for_typical_cost": 5000000}, {"blocks": 10, "fee_per_cost": 0.0, "fee_for_typical_cost": 0}], "min_fee_per_cost": 0.5, "min_fee_for_typical_cost": 2500000},
  "blocks": [
    {"height": 8412345, "header_hash": "${HASH}", "timestamp": 1790480000, "fees": 350012, "additions": 42, "removals": 17,
     "record": {"height": 8412345, "header_hash": "${HASH}", "prev_hash": "0x00", "weight": 36893488147419103232, "total_iters": 1, "timestamp": 1790480000, "fees": 350012, "farmer_puzzle_hash": "0x01", "pool_puzzle_hash": "0x02"},
     "spends": 17, "assets": {"xch": "12209542198803", "cats": [{"asset_id": "${CAT}", "amount": "3938"}], "nfts": 1, "dids": 0, "singletons": 2}},
    {"height": 8412344, "header_hash": "0x01", "timestamp": null, "fees": null, "additions": 0, "removals": 0,
     "record": {"height": 8412344, "header_hash": "0x01", "prev_hash": "0x00", "weight": 1, "total_iters": 1, "timestamp": null, "fees": null, "farmer_puzzle_hash": "0x01", "pool_puzzle_hash": "0x02"}},
    {"height": 8412343, "header_hash": "0x02", "timestamp": 1790479900, "fees": 1, "additions": 1, "removals": 1}
  ],
  "mempool": {"size": 2, "items": [
    {"id": "0x77", "first_seen_ms": 1790480012000, "fee_mojos": 50000000, "cost": 12000000, "spends": 2, "additions": [], "removals": [], "addition_count": 3, "removal_count": 2, "kind": "cat", "asset_ids": ["0x99"], "assets": {"xch": "50000000", "cats": [], "nfts": 0, "dids": 0, "singletons": 0}}
  ]},
  "success": true
}`;

describe("parseDashboard", () => {
  test("the state, the records, the totals, the mempool and the quote, each in the app's shape", () => {
    const d = parseDashboard(parseJsonSafe(DASHBOARD));
    if (!d) throw new Error("no dashboard");
    expect(d.state.peak.height).toBe(8412345);
    expect(d.state.space).toBe(36893488147419103232000n);
    expect(d.state.mempoolFees).toBe(50000001n);
    // The block without a record is left out; the record's digits are kept.
    expect(d.records.map((r) => r.height)).toEqual([8412345, 8412344]);
    expect(d.records[0]!.weight).toBe(36893488147419103232n);
    expect(d.records[1]!.isTransactionBlock).toBe(false);
    // Only the transaction block the loop read has totals, summed like this app's own spends.
    expect(d.totals).toEqual([
      {
        height: 8412345,
        hash: "ab".repeat(32),
        totals: {
          xch: "12209542198803",
          cats: [{ assetId: "cc".repeat(32), amount: "3938" }],
          nfts: 1,
          dids: 0,
          singletons: 2,
          source: "gateway",
          count: 17,
          partial: false,
        },
      },
    ]);
    expect(d.mempool.size).toBe(2);
    expect(d.mempool.items?.map((i) => i.id)).toEqual(["77"]);
    expect(d.fees).toEqual({
      targets: [
        { blocks: 1, feePerCost: 3 },
        { blocks: 3, feePerCost: 1 },
        { blocks: 10, feePerCost: 0 },
      ],
      minFeePerCost: 0.5,
    });
  });
  test("an answer that is no dashboard (an older gateway's page) is null", () => {
    expect(parseDashboard(null)).toBeNull();
    expect(parseDashboard({ success: true })).toBeNull();
    expect(parseDashboard({ blockchain_state: {}, blocks: "no", mempool: {} })).toBeNull();
  });
  test("a mempool entry without details voids the items, as a delta frame's would", () => {
    const d = parseDashboard(
      parseJsonSafe(DASHBOARD.replace('"kind": "cat", "asset_ids": ["0x99"], ', ""))
    );
    expect(d?.mempool.items).toBeNull();
    expect(d?.mempool.size).toBe(2);
  });
});

describe("feeEstimateFromQuote", () => {
  test("each target's fee is its rate times the cost, never below the node's minimum", () => {
    const quote = parseFeeQuote({
      estimates: [
        { blocks: 1, fee_per_cost: 3.0 },
        { blocks: 3, fee_per_cost: 1.0 },
        { blocks: 10, fee_per_cost: 0.0 },
      ],
      min_fee_per_cost: 0.5,
    });
    if (!quote) throw new Error("no quote");
    const estimate = feeEstimateFromQuote(quote, 6_000_000, null);
    expect(estimate.targetTimes).toEqual([60, 180, 600]);
    expect(estimate.estimates).toEqual([18_000_000n, 6_000_000n, 3_000_000n]);
    // What the quote cannot say is null, not a made-up zero.
    expect(estimate.currentFeeRate).toBeNull();
    expect(estimate.feesLastBlock).toBeNull();
    expect(estimate.feeRateLastBlock).toBeNull();
    expect(estimate.numSpends).toBeNull();
    expect(estimate.peakHeight).toBe(0);
  });
  test("the mempool figures come from the state when it is known", () => {
    const d = parseDashboard(parseJsonSafe(DASHBOARD));
    if (!d?.fees) throw new Error("no quote");
    const estimate = feeEstimateFromQuote(d.fees, 5_000_000, d.state);
    expect(estimate.peakHeight).toBe(8412345);
    expect(estimate.lastTxBlockHeight).toBe(8412345);
    expect(estimate.mempoolCost).toBe(24_000_000);
    expect(estimate.mempoolMaxCost).toBe(110_000_000_000);
    expect(estimate.mempoolFees).toBe(50000001n);
    expect(estimate.synced).toBe(true);
  });
  test("a quote needs at least one target with a rate", () => {
    expect(parseFeeQuote({ estimates: [] })).toBeNull();
    expect(parseFeeQuote({ estimates: [{ blocks: 1 }] })).toBeNull();
    expect(parseFeeQuote({ min_fee_per_cost: 0 })).toBeNull();
  });
});

describe("blockTotalsFromFrame", () => {
  test("a frame without spends or assets (a block the loop did not read) has no totals", () => {
    expect(blockTotalsFromFrame({ height: 1, header_hash: "0x01" })).toBeNull();
    expect(blockTotalsFromFrame({ spends: 3 })).toBeNull();
  });
  test("amounts stay decimal digits whatever they came as", () => {
    const totals = blockTotalsFromFrame({
      spends: 0,
      assets: { xch: 12209542198803n, cats: [{ amount: 5 }], nfts: 0, dids: 0, singletons: 0 },
    });
    expect(totals?.xch).toBe("12209542198803");
    expect(totals?.cats).toEqual([{ assetId: "unknown", amount: "5" }]);
    expect(totals?.count).toBe(0);
  });
});
