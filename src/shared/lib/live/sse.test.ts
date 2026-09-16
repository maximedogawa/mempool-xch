import { describe, expect, test } from "bun:test";
import { createLiveStream, parseServerEvent, type LiveEvent } from "./stream";

class FakeEventSource {
  static instances: FakeEventSource[] = [];
  readyState = 0;
  onopen: (() => void) | null = null;
  onerror: (() => void) | null = null;
  listeners = new Map<string, ((e: { data: string }) => void)[]>();
  closed = false;
  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }
  addEventListener(name: string, fn: (e: { data: string }) => void) {
    this.listeners.set(name, [...(this.listeners.get(name) ?? []), fn]);
  }
  close() {
    this.closed = true;
    this.readyState = 2;
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  emit(name: string, data: unknown) {
    this.listeners.get(name)?.forEach((fn) => fn({ data: JSON.stringify(data) }));
  }
  fail(fatal: boolean) {
    this.readyState = fatal ? 2 : 0;
    this.onerror?.();
  }
}

function build(overrides: { wsUrl?: string | null } = {}) {
  FakeEventSource.instances = [];
  const events: LiveEvent[] = [];
  const timers: { fn: () => void; ms: number }[] = [];
  const stream = createLiveStream({
    sseUrl: "/api/mainnet/events",
    wsUrl: overrides.wsUrl ?? null,
    poll: async () => ({ peakHeight: 1, peakIsTx: true, mempoolSize: 0 }),
    onEvent: (e) => events.push(e),
    EventSourceImpl: FakeEventSource as unknown as typeof EventSource,
    WebSocketImpl: undefined,
    setTimeoutImpl: (fn, ms) => {
      timers.push({ fn, ms });
      return timers.length as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeoutImpl: () => {},
    maxWsFailures: 2,
  });
  return { stream, events, timers };
}

describe("live stream over server-sent events", () => {
  test("prefers the hosted stream, maps server events and reports live", async () => {
    const { stream, events } = build();
    stream.start();
    const es = FakeEventSource.instances[0]!;
    expect(es.url).toBe("/api/mainnet/events");
    expect(stream.transport).toBe("sse");
    es.open();
    expect(stream.status).toBe("live");
    es.emit("peak", { height: 500, tx: true, at: 1 });
    es.emit("transaction", { ids: ["ab"], status: "pending", height: null });
    es.emit("live", { txCount: 12, totalCost: 1, totalFee: "0", avgFeeRate: 0, backlogBlocks: 0 });
    es.emit("mempool_delta", { added: [{ id: "a" }], removed: [] });
    es.emit("block", { stats: { height: 501, isTransactionBlock: false } });
    es.emit("resync", {});
    expect(events.filter((e) => e.type !== "status")).toEqual([
      { type: "peak", height: 500, tx: true },
      { type: "transaction", ids: ["ab"], status: "pending", height: null },
      { type: "mempool", size: 12 },
      { type: "mempool_delta", added: 1, removed: 0 },
      { type: "block", height: 501, tx: false },
      { type: "resync" },
    ]);
    stream.stop();
    expect(es.closed).toBe(true);
  });

  test("a browser-side reconnect keeps 'live' until the grace period passes", () => {
    const { stream, timers } = build();
    stream.start();
    const es = FakeEventSource.instances[0]!;
    es.open();
    es.fail(false);
    expect(stream.status).toBe("live");
    const grace = timers.find((t) => t.ms === 10_000);
    expect(grace).toBeDefined();
    grace!.fn();
    expect(stream.status).toBe("connecting");
    es.open();
    expect(stream.status).toBe("live");
  });

  test("fatal failures back off, then fall back to polling when there is no WebSocket", () => {
    const { stream, timers } = build();
    stream.start();
    FakeEventSource.instances[0]!.fail(true);
    expect(stream.status).toBe("connecting");
    const retry = timers.find((t) => t.ms === 1_000);
    expect(retry).toBeDefined();
    retry!.fn();
    expect(FakeEventSource.instances).toHaveLength(2);
    FakeEventSource.instances[1]!.fail(true);
    expect(stream.status).toBe("polling");
    expect(stream.transport).toBe("polling");
  });

  test("parseServerEvent ignores unknown names and malformed payloads", () => {
    expect(parseServerEvent("netspace", "{}")).toBeNull();
    expect(parseServerEvent("peak", "{not json")).toBeNull();
    expect(parseServerEvent("peak", '{"height":"x"}')).toBeNull();
  });
});
