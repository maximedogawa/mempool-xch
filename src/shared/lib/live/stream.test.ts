import { describe, expect, test } from "bun:test";
import { backoffDelay, createLiveStream, parseCoinsetMessage, type LiveEvent, type TimerId } from "./stream";

describe("parseCoinsetMessage", () => {
  test("peak and transaction envelopes", () => {
    expect(
      parseCoinsetMessage('{"network":"mainnet","seq":1,"message":{"type":"peak","data":{"height":9295535,"tx":false}}}')
    ).toEqual({ type: "peak", height: 9295535, tx: false });
    expect(
      parseCoinsetMessage(
        '{"seq":2,"message":{"type":"transaction","data":{"ids":["0xAB","cd"],"status":"confirmed","height":5}}}'
      )
    ).toEqual({ type: "transaction", ids: ["ab", "cd"], status: "confirmed", height: 5 });
    expect(parseCoinsetMessage('{"message":{"type":"offer","data":{}}}')).toBeNull();
    expect(parseCoinsetMessage("garbage")).toBeNull();
    expect(parseCoinsetMessage('{"message":{"type":"peak","data":{}}}')).toBeNull();
  });
});

describe("backoffDelay", () => {
  test("doubles and caps", () => {
    expect(backoffDelay(1)).toBe(1000);
    expect(backoffDelay(2)).toBe(2000);
    expect(backoffDelay(4)).toBe(8000);
    expect(backoffDelay(10)).toBe(30000);
  });
});

/** Deterministic timers: run callbacks in order on demand. */
function fakeTimers() {
  const queue: { id: number; fn: () => void; at: number }[] = [];
  let now = 0;
  let nextId = 1;
  return {
    setTimeoutImpl: (fn: () => void, ms: number): TimerId => {
      const id = nextId++;
      queue.push({ id, fn, at: now + ms });
      return id as unknown as TimerId;
    },
    clearTimeoutImpl: (id: TimerId) => {
      const idx = queue.findIndex((q) => q.id === (id as unknown as number));
      if (idx !== -1) queue.splice(idx, 1);
    },
    async advance(ms: number) {
      now += ms;
      const due = queue.filter((q) => q.at <= now).sort((a, b) => a.at - b.at);
      due.forEach((q) => queue.splice(queue.indexOf(q), 1));
      for (const q of due) {
        q.fn();
        await Promise.resolve();
        await Promise.resolve();
      }
    },
    pending: () => queue.map((q) => q.at - now),
  };
}

class FakeSocket {
  static instances: FakeSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  closed = false;
  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }
  close() {
    this.closed = true;
  }
  open() {
    this.onopen?.();
  }
  message(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
  drop() {
    this.onclose?.();
  }
}

describe("createLiveStream", () => {
  test("polling-only endpoint emits peak and mempool changes and reports polling status", async () => {
    const timers = fakeTimers();
    const events: LiveEvent[] = [];
    const samples = [
      { peakHeight: 10, peakIsTx: false, mempoolSize: 3 },
      { peakHeight: 10, peakIsTx: false, mempoolSize: 4 },
      { peakHeight: 11, peakIsTx: true, mempoolSize: 4 },
    ];
    let i = 0;
    const stream = createLiveStream({
      wsUrl: null,
      poll: async () => samples[Math.min(i++, samples.length - 1)]!,
      onEvent: (e) => events.push(e),
      pollIntervalMs: 1000,
      setTimeoutImpl: timers.setTimeoutImpl,
      clearTimeoutImpl: timers.clearTimeoutImpl,
    });
    stream.start();
    await Promise.resolve();
    await Promise.resolve();
    expect(events).toContainEqual({ type: "status", status: "polling" });
    expect(events).toContainEqual({ type: "peak", height: 10, tx: false });
    expect(events).toContainEqual({ type: "mempool", size: 3 });
    await timers.advance(1000);
    expect(events.filter((e) => e.type === "mempool").length).toBe(2);
    expect(events.filter((e) => e.type === "peak").length).toBe(1);
    await timers.advance(1000);
    expect(events).toContainEqual({ type: "peak", height: 11, tx: true });
    stream.stop();
    expect(stream.status).toBe("offline");
    expect(timers.pending()).toEqual([]);
  });

  test("websocket goes live, forwards events, reconnects with backoff and falls back to polling", async () => {
    FakeSocket.instances = [];
    const timers = fakeTimers();
    const events: LiveEvent[] = [];
    const stream = createLiveStream({
      wsUrl: "wss://api.coinset.org/ws",
      poll: async () => ({ peakHeight: 1, peakIsTx: false, mempoolSize: 0 }),
      onEvent: (e) => events.push(e),
      pollIntervalMs: 60_000,
      maxWsFailures: 2,
      WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
      setTimeoutImpl: timers.setTimeoutImpl,
      clearTimeoutImpl: timers.clearTimeoutImpl,
    });
    stream.start();
    await Promise.resolve();
    const s1 = FakeSocket.instances[0]!;
    expect(s1.url).toBe("wss://api.coinset.org/ws?events=peak,transaction");
    expect(stream.status).toBe("connecting");
    s1.open();
    expect(stream.status).toBe("live");
    s1.message({ message: { type: "peak", data: { height: 42, tx: true } } });
    s1.message({ message: { type: "transaction", data: { ids: ["ab"], status: "pending" } } });
    expect(events).toContainEqual({ type: "peak", height: 42, tx: true });
    expect(events).toContainEqual({ type: "transaction", ids: ["ab"], status: "pending", height: null });

    // First drop: reconnect after 1 s.
    s1.drop();
    expect(stream.status).toBe("connecting");
    expect(timers.pending()).toContain(1000);
    await timers.advance(1000);
    const s2 = FakeSocket.instances[1]!;
    expect(s2).toBeDefined();
    // Second failure hits the limit: polling, with a background retry at the max backoff.
    s2.drop();
    expect(stream.status).toBe("polling");
    expect(timers.pending()).toContain(30_000);
    stream.stop();
    expect(FakeSocket.instances.length).toBe(2);
  });
});
