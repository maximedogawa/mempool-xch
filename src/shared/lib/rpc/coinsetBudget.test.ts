import { expect, test } from "bun:test";
import { createRpcClient, type FetchLike } from "./client";

const COINSET = "https://api.coinset.org";

/** Answers 503 `failures` times, then a successful blockchain state. */
function flakyFetch(failures: number) {
  const calls: string[] = [];
  const fetchImpl: FetchLike = async (input) => {
    calls.push(String(input));
    return calls.length <= failures
      ? new Response("upstream connect error", { status: 503 })
      : new Response(JSON.stringify({ success: true, status: "SUCCESS", tx_ids: [] }));
  };
  return { calls, fetchImpl };
}

test("full-node RPC calls to Coinset share the gate and survive one 503", async () => {
  const { calls, fetchImpl } = flakyFetch(1);
  const client = createRpcClient({ rpcUrl: COINSET, indexedUrl: COINSET, fetchImpl });
  expect(await client.getAllMempoolTxIds()).toEqual([]);
  expect(calls.length).toBe(2);
});

test("a custom node is not gated or retried by the transport", async () => {
  const { calls, fetchImpl } = flakyFetch(1);
  const client = createRpcClient({ rpcUrl: "http://localhost:8555", indexedUrl: null, fetchImpl });
  await expect(client.getAllMempoolTxIds()).rejects.toMatchObject({ kind: "http", status: 503 });
  expect(calls.length).toBe(1);
});

test("push_tx is never replayed", async () => {
  const { calls, fetchImpl } = flakyFetch(1);
  const client = createRpcClient({ rpcUrl: COINSET, indexedUrl: COINSET, fetchImpl });
  await expect(client.pushTx({})).rejects.toMatchObject({ kind: "http", status: 503 });
  expect(calls.length).toBe(1);
});
