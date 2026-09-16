import { describe, expect, test } from "bun:test";
import { CoinsetMeter, meteredFetch } from "./coinsetMeter";

describe("CoinsetMeter", () => {
  test("counts per method and keeps a one-minute window", () => {
    let now = 0;
    const meter = new CoinsetMeter(() => now);
    meter.record("get_blockchain_state");
    now = 30_000;
    meter.record("get_block_records");
    now = 70_000;
    meter.record("get_blockchain_state");
    const s = meter.snapshot();
    expect(s.total).toBe(3);
    expect(s.byMethod).toEqual({ get_blockchain_state: 2, get_block_records: 1 });
    expect(s.lastMinute).toBe(2);
  });

  test("meteredFetch records the method from the URL", async () => {
    const meter = new CoinsetMeter();
    const calls: string[] = [];
    const f = meteredFetch(meter, (async (input: string | URL | Request) => {
      calls.push(String(input));
      return new Response("{}");
    }) as typeof fetch);
    await f("https://api.coinset.org/get_fee_estimate");
    expect(meter.snapshot().byMethod).toEqual({ get_fee_estimate: 1 });
    expect(calls).toHaveLength(1);
  });
});
