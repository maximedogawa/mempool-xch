import { expect, test } from "bun:test";
import { createReadGate } from "./readGate";
import { RpcError } from "./errors";

function gate() {
  let clock = 0;
  const waits: number[] = [];
  return {
    waits,
    read: createReadGate({
      now: () => clock,
      jitter: () => 0,
      delay: async (ms) => {
        waits.push(ms);
        clock += ms;
      },
    }),
  };
}

test("CORS-opaque network failure backs off once and recovers", async () => {
  const { read, waits } = gate();
  let calls = 0;
  const result = await read(async () => {
    if (++calls === 1) throw new RpcError("network", "get_block_transactions", "Failed to fetch");
    return "recovered";
  });
  expect(result).toBe("recovered");
  expect(calls).toBe(2);
  expect(waits).toEqual([1000]);
});

test("persistent 503 is bounded and cools down following reads", async () => {
  const { read, waits } = gate();
  let calls = 0;
  const error = await read(async () => {
    calls++;
    throw new RpcError("http", "get_transactions_by_cat_asset_id", "unavailable", { status: 503 });
  }).catch((e: RpcError) => e);
  expect(calls).toBe(2);
  expect(error.retryHandled).toBe(true);
  await read(async () => "next");
  expect(waits).toEqual([1000, 3000]);
});

test("permanent HTTP and application failures are not retried", async () => {
  const { read, waits } = gate();
  for (const error of [
    new RpcError("http", "read", "bad", { status: 400 }),
    new RpcError("rpc", "read", "bad"),
  ]) {
    let calls = 0;
    await expect(
      read(async () => {
        calls++;
        throw error;
      })
    ).rejects.toBe(error);
    expect(calls).toBe(1);
  }
  expect(waits).toEqual([]);
});

test("cancelling a queued indexed read never reaches its transport", async () => {
  const read = createReadGate({ concurrency: 1 });
  let release!: () => void;
  const first = read(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      })
  );
  await Promise.resolve();
  const controller = new AbortController();
  let calls = 0;
  const cancelled = read(async () => {
    calls++;
  }, controller.signal).catch(() => "cancelled");
  controller.abort();
  expect(await cancelled).toBe("cancelled");
  release();
  await first;
  expect(calls).toBe(0);
});
