import { expect, test } from "bun:test";
import {
  createPacedGate,
  createReadGate,
  PACED_QUOTA_PAUSE_MS,
  PACED_RETRY_AFTER_MAX_MS,
} from "./readGate";
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

function paced(minGapMs = 250) {
  let clock = 0;
  const waits: number[] = [];
  const starts: number[] = [];
  return {
    waits,
    starts,
    now: () => clock,
    read: createPacedGate({
      minGapMs,
      now: () => clock,
      jitter: () => 0,
      delay: async (ms) => {
        waits.push(ms);
        clock += ms;
      },
    }),
  };
}

// Real timers: with a faked clock, one waiting call would move time for the others.
test("nodexch calls start no closer together than the gap", async () => {
  const read = createPacedGate({ minGapMs: 15 });
  const starts: number[] = [];
  await Promise.all(
    [1, 2, 3, 4, 5, 6].map((n) =>
      read(async () => {
        starts.push(performance.now());
        return n;
      })
    )
  );
  expect(starts.length).toBe(6);
  const gaps = starts.slice(1).map((at, k) => at - starts[k]!);
  // Timers may fire a hair early against performance.now().
  expect(Math.min(...gaps)).toBeGreaterThanOrEqual(13);
});

test("a 429 waits for the gateway's retry-after and is retried once", async () => {
  const { read, starts, now } = paced();
  const result = await read(async () => {
    starts.push(now());
    if (starts.length === 1)
      throw new RpcError("http", "get_blockchain_state", "rate limited", {
        status: 429,
        retryAfterMs: 20_000,
      });
    return "ok";
  });
  expect(result).toBe("ok");
  // Nothing went out during the 20 s the gateway asked for.
  expect(starts).toEqual([0, 20_000]);
});

test("a second refusal is handed on, marked so that Query does not retry it too", async () => {
  const { read } = paced();
  let calls = 0;
  const error = await read(async () => {
    calls++;
    throw new RpcError("http", "get_fee_estimate", "rate limited", {
      status: 429,
      retryAfterMs: 10 * 60_000,
    });
  }).catch((e: RpcError) => e);
  expect(calls).toBe(2);
  expect((error as RpcError).retryHandled).toBe(true);
});

test("a retry-after longer than the cap waits the cap", async () => {
  const { read, waits } = paced();
  let calls = 0;
  await read(async () => {
    if (++calls === 1)
      throw new RpcError("http", "m", "rate limited", { status: 429, retryAfterMs: 3_600_000 });
    return 1;
  });
  expect(Math.max(...waits)).toBe(PACED_RETRY_AFTER_MAX_MS);
});

test("a used-up quota is not retried and pauses the calls that follow", async () => {
  const { read, now } = paced();
  let calls = 0;
  const error = await read(async () => {
    calls++;
    throw new RpcError("http", "get_block_records", "quota", {
      status: 429,
      detail: '{"success":false,"error":"monthly quota used","code":"quota_exceeded"}',
    });
  }).catch((e: RpcError) => e);
  expect(calls).toBe(1);
  expect((error as RpcError).retryHandled).toBe(true);
  let startedAt = -1;
  await read(async () => {
    startedAt = now();
  });
  expect(startedAt).toBe(PACED_QUOTA_PAUSE_MS);
});

test("a refusal that is no rate limit (403, 404) is handed on at once", async () => {
  const { read, waits } = paced();
  let calls = 0;
  const error = await read(async () => {
    calls++;
    throw new RpcError("http", "m", "forbidden", { status: 403 });
  }).catch((e: RpcError) => e);
  expect(calls).toBe(1);
  expect((error as RpcError).retryHandled).toBe(false);
  expect(waits).toEqual([]);
});
