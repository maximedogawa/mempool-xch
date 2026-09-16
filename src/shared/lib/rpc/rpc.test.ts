import { describe, expect, test } from "bun:test";
import blockchainState from "@/test-utils/fixtures/blockchain_state.json";
import blockRecords from "@/test-utils/fixtures/block_records.json";
import blockTransactions from "@/test-utils/fixtures/block_transactions.json";
import feeEstimate from "@/test-utils/fixtures/fee_estimate.json";
import fullBlock from "@/test-utils/fixtures/full_block.json";
import mempoolItems from "@/test-utils/fixtures/mempool_items.json";
import xchBalance from "@/test-utils/fixtures/xch_balance.json";
import catBalances from "@/test-utils/fixtures/cat_balances.json";
import { createRpcClient, type FetchLike } from "./client";
import { RpcError } from "./errors";
import { parseJsonSafe, stringifyJsonSafe } from "./json";
import {
  normaliseBlockRecord,
  normaliseBlockchainState,
  normaliseCatBalances,
  normaliseFeeEstimate,
  normaliseFullBlock,
  normaliseMempoolItem,
  normaliseTxList,
  normaliseXchBalance,
} from "./normalise";

describe("parseJsonSafe", () => {
  test("keeps huge integers exact and leaves strings alone", () => {
    const parsed = parseJsonSafe(
      '{"amount": 21000000000000000000, "small": 42, "arr": [12345678901234567890, 1], "id": "0x12345678901234567890", "neg": -98765432109876543210}'
    ) as Record<string, unknown>;
    expect(parsed.amount).toBe(21000000000000000000n);
    expect(parsed.small).toBe(42);
    expect(parsed.arr).toEqual([12345678901234567890n, 1]);
    expect(parsed.id).toBe("0x12345678901234567890");
    expect(parsed.neg).toBe(-98765432109876543210n);
  });
  test("stringify turns bigint into numbers", () => {
    expect(stringifyJsonSafe({ a: 5n, b: [1n] })).toBe('{"a":5,"b":[1]}');
  });
});

describe("normalisers with recorded Coinset fixtures", () => {
  test("blockchain state", () => {
    const s = normaliseBlockchainState(blockchainState.blockchain_state);
    expect(s.peak.height).toBe(9295519);
    expect(s.peak.isTransactionBlock).toBe(false);
    expect(s.blockMaxCost).toBe(11_000_000_000);
    expect(s.mempoolSize).toBe(74);
    expect(s.mempoolFees).toBe(511752094n);
    expect(s.mempoolMinFees.cost_5000000).toBe(0);
    expect(s.synced).toBe(true);
  });
  test("block records distinguish transaction blocks", () => {
    const records = blockRecords.block_records.map(normaliseBlockRecord);
    const tx = records.filter((r) => r.isTransactionBlock);
    expect(records.length).toBe(12);
    expect(tx.length).toBeGreaterThan(0);
    const withFees = tx.find((r) => r.height === 9295514);
    expect(withFees?.fees).toBe(604585170n);
    expect(withFees?.timestamp).toBe(1789478793);
    expect(withFees?.headerHash.startsWith("0x")).toBe(false);
    expect(records.find((r) => r.height === 9295513)?.fees).toBeNull();
  });
  test("full block summary", () => {
    const b = normaliseFullBlock(fullBlock.block);
    expect(b.isTransactionBlock).toBe(true);
    expect(b.height).toBe(9295517);
    expect(b.timestamp).toBe(1789478866);
    expect(b.cost).toBe(0);
    expect(b.hasGenerator).toBe(false);
  });
  test("mempool items", () => {
    const items = Object.values(mempoolItems.mempool_items).map(normaliseMempoolItem);
    expect(items.length).toBe(3);
    const first = items[0]!;
    expect(first.name).toHaveLength(64);
    expect(typeof first.fee).toBe("bigint");
    expect(first.cost).toBeGreaterThan(0);
    expect(first.removals.length).toBeGreaterThan(0);
    expect(first.spendBundle.coinSpends.length).toBeGreaterThan(0);
  });
  test("fee estimate", () => {
    const f = normaliseFeeEstimate(feeEstimate);
    expect(f.targetTimes).toEqual([60, 300, 600]);
    expect(f.estimates).toEqual([373687n, 1713n, 214n]);
    expect(f.currentFeeRate).toBeCloseTo(0.3737, 3);
    expect(f.mempoolMaxCost).toBe(110_000_000_000);
    expect(f.mempoolCost).toBe(100_636_754_421);
  });
  test("transaction list and kind derivation", () => {
    const list = normaliseTxList(blockTransactions);
    expect(list.transactions.length).toBe(1);
    const tx = list.transactions[0]!;
    expect(tx.id).toBe("b379124c34f5843bc709e460abddcbebeda648ba4b0978b44fac20fb8eb14df5");
    expect(tx.status).toBe("confirmed");
    expect(tx.kind).toBe("transfer");
    expect(tx.feeMojos).toBe(604585170n);
    expect(tx.confirmedHeight).toBe(9295514);
    expect(tx.events[0]!.participants.length).toBe(2);
    expect(tx.events[0]!.participants[0]!.received.xch).toBe(114150535534n);
    expect(tx.events[0]!.inputs[0]!.outerPuzzleType).toBe("XCH");
    expect(list.nextCursor).toBeNull();
  });
  test("balances", () => {
    const b = normaliseXchBalance(xchBalance);
    expect(b.confirmed).toBe(673045466616444n);
    expect(b.pending).toBe(-23958166830339n);
    const cats = normaliseCatBalances(catBalances);
    expect(cats.length).toBe(2);
    expect(cats[0]!.confirmed).toBe(213125n);
    expect(cats[0]!.assetId.startsWith("0x")).toBe(false);
  });
});

function mockFetch(handler: (url: string, body: Record<string, unknown>) => Response | Promise<Response>): FetchLike {
  return async (input, init) => {
    const url = String(input);
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};
    return handler(url, body);
  };
}

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

describe("createRpcClient", () => {
  test("posts to <base>/<method> with hex-prefixed ids and normalises", async () => {
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    const client = createRpcClient({
      rpcUrl: "https://api.coinset.org/",
      indexedUrl: "https://api.coinset.org",
      fetchImpl: mockFetch((url, body) => {
        calls.push({ url, body });
        if (url.endsWith("/get_blockchain_state")) return json(blockchainState);
        if (url.endsWith("/get_all_mempool_tx_ids")) return json({ tx_ids: ["0xaa", "bb"], success: true });
        if (url.endsWith("/get_block_record_by_height")) return json({ block_record: blockRecords.block_records.find((r) => r.height === 9295514), success: true });
        if (url.endsWith("/get_transaction")) return json({ transaction: blockTransactions.transactions[0], success: true });
        if (url.endsWith("/get_fee_estimate")) return json(feeEstimate);
        return json({ success: false, error: "unknown" }, 200);
      }),
    });
    const state = await client.getBlockchainState();
    expect(state.peak.height).toBe(9295519);
    expect(calls[0]!.url).toBe("https://api.coinset.org/get_blockchain_state");
    expect(await client.getAllMempoolTxIds()).toEqual(["aa", "bb"]);
    const record = await client.getBlockRecordByHeight(9295514);
    expect(record.height).toBe(9295514);
    expect(calls[2]!.body).toEqual({ height: 9295514 });
    const tx = await client.getTransaction("b379124c34f5843bc709e460abddcbebeda648ba4b0978b44fac20fb8eb14df5");
    expect(tx.kind).toBe("transfer");
    const fee = await client.getFeeEstimate(1_000_000, [60, 300]);
    expect(calls[4]!.body).toEqual({ cost: 1_000_000, target_times: [60, 300] });
    expect(fee.estimates[0]).toBe(373687n);
  });

  test("distinguishes network, http, rpc, not-found and malformed errors", async () => {
    const client = createRpcClient({
      rpcUrl: "https://node.example",
      indexedUrl: null,
      fetchImpl: mockFetch((url) => {
        if (url.endsWith("/get_blockchain_state")) throw new TypeError("fetch failed");
        if (url.endsWith("/get_block_record")) return new Response("nope", { status: 503 });
        if (url.endsWith("/get_coin_record_by_name")) return json({ success: false, error: "Coin record 0xaa not found" });
        if (url.endsWith("/get_block")) return json({ success: false, error: "Something exploded" });
        return new Response("<html>", { status: 200 });
      }),
    });
    await expect(client.getBlockchainState()).rejects.toMatchObject({ kind: "network" });
    await expect(client.getBlockRecord("aa")).rejects.toMatchObject({ kind: "http", status: 503 });
    await expect(client.getCoinRecordByName("aa")).rejects.toMatchObject({ kind: "not_found" });
    await expect(client.getBlock("aa")).rejects.toMatchObject({ kind: "rpc", message: "Something exploded" });
    await expect(client.getAllMempoolTxIds()).rejects.toMatchObject({ kind: "malformed" });
    await expect(client.getTransaction("aa")).rejects.toBeInstanceOf(RpcError);
    expect(client.hasIndexed).toBe(false);
  });

  test("null payloads become not_found", async () => {
    const client = createRpcClient({
      rpcUrl: "https://api.coinset.org",
      indexedUrl: "https://api.coinset.org",
      fetchImpl: mockFetch(() => json({ transaction: null, mempool_item: null, success: true })),
    });
    await expect(client.getTransaction("aa")).rejects.toMatchObject({ kind: "not_found" });
    await expect(client.getMempoolItemByTxId("aa")).rejects.toMatchObject({ kind: "not_found" });
  });
});
