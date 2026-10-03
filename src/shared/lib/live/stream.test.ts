import { streamUrl } from "./stream";
import { describe, expect, test } from "bun:test";
import {
  backoffDelay,
  createLiveStream,
  parseCoinsetMessage,
  type LiveEvent,
  type TimerId,
} from "./stream";

describe("parseCoinsetMessage", () => {
  test("peak and transaction envelopes", () => {
    expect(
      parseCoinsetMessage(
        '{"network":"mainnet","seq":1,"message":{"type":"peak","data":{"height":9295535,"tx":false}}}'
      )
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
  readyState = 0;
  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }
  close() {
    this.closed = true;
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  message(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
  drop() {
    this.readyState = 3;
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
    // The first sample has nothing to compare with: only a change is an event.
    expect(events.filter((e) => e.type === "mempool")).toEqual([]);
    await timers.advance(1000);
    expect(events.filter((e) => e.type === "mempool")).toEqual([{ type: "mempool", size: 4 }]);
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
    expect(s1.url).toBe("wss://api.coinset.org/ws?events=peak,transaction,reorg,dashboard,vault");
    expect(stream.status).toBe("connecting");
    s1.open();
    expect(stream.status).toBe("live");
    s1.message({ message: { type: "peak", data: { height: 42, tx: true } } });
    s1.message({ message: { type: "transaction", data: { ids: ["ab"], status: "pending" } } });
    expect(events).toContainEqual({ type: "peak", height: 42, tx: true });
    expect(events).toContainEqual({
      type: "transaction",
      ids: ["ab"],
      status: "pending",
      height: null,
    });

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

  test("a socket that is open is never labelled polling, even if its open event was missed", async () => {
    FakeSocket.instances = [];
    const timers = fakeTimers();
    const stream = createLiveStream({
      wsUrl: "wss://api.coinset.org/ws",
      poll: async () => ({ peakHeight: 1, peakIsTx: false, mempoolSize: 0 }),
      onEvent: () => {},
      pollIntervalMs: 15_000,
      maxWsFailures: 1,
      WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
      setTimeoutImpl: timers.setTimeoutImpl,
      clearTimeoutImpl: timers.clearTimeoutImpl,
    });
    stream.start();
    await Promise.resolve();
    FakeSocket.instances[0]!.drop();
    expect(stream.status).toBe("polling");

    // The retry connects and reaches OPEN, but its onopen never runs (a frozen tab, a callback
    // the browser drops). Nothing else would ever correct the pill.
    await timers.advance(30_000);
    const retried = FakeSocket.instances[1]!;
    retried.readyState = 1;
    // The retry left the label on "connecting" and, with onopen lost, nothing would move it.
    expect(stream.status).toBe("connecting");

    // The next poll reads the socket rather than the last event, and puts it right.
    await timers.advance(15_000);
    expect(stream.status).toBe("live");
    stream.stop();
  });

  test("the background retry brings the pill back to live, and a later poll does not undo it", async () => {
    FakeSocket.instances = [];
    const timers = fakeTimers();
    const stream = createLiveStream({
      wsUrl: "wss://api.coinset.org/ws",
      poll: async () => ({ peakHeight: 1, peakIsTx: false, mempoolSize: 0 }),
      onEvent: () => {},
      pollIntervalMs: 15_000,
      maxWsFailures: 1,
      WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
      setTimeoutImpl: timers.setTimeoutImpl,
      clearTimeoutImpl: timers.clearTimeoutImpl,
    });
    stream.start();
    await Promise.resolve();
    FakeSocket.instances[0]!.drop();
    expect(stream.status).toBe("polling");
    expect(stream.transport).toBe("polling");

    // The retry at the max backoff reconnects: the tab is on the socket again.
    await timers.advance(30_000);
    const retried = FakeSocket.instances[1]!;
    expect(retried).toBeDefined();
    retried.open();
    expect(stream.status).toBe("live");
    expect(stream.transport).toBe("websocket");

    // Polls keep running behind the socket; none of them may take the pill back to "polling".
    await timers.advance(15_000);
    await timers.advance(15_000);
    expect(stream.status).toBe("live");
    stream.stop();
  });
});

describe("parseCoinsetMessage: reorg and netspace", () => {
  test("reorg frames carry both peaks and the depth", () => {
    expect(
      parseCoinsetMessage(
        '{"message":{"type":"reorg","data":{"id":"reorg_81","detected_at_ms":1789680142516,"old_peak_height":9306355,"old_peak_hash":"aa","new_peak_height":9306354,"new_peak_hash":"bb","reorg_depth":1}}}'
      )
    ).toEqual({
      type: "reorg",
      oldPeakHeight: 9306355,
      newPeakHeight: 9306354,
      depth: 1,
      detectedAtMs: 1789680142516,
    });
  });
  test("a nodexch block frame with the node's record is a new block, every digit kept", () => {
    const frame =
      '{"message":{"type":"dashboard","data":{"kind":"block","height":7,"header_hash":"0xab","timestamp":1790480000,"fees":5,"additions":1,"removals":1,"record":{"height":7,"header_hash":"0xAB","prev_hash":"0xaa","weight":340282366920938463463374607431768211455,"total_iters":1,"timestamp":1790480000,"fees":5,"farmer_puzzle_hash":"0x01","pool_puzzle_hash":"0x02"}}}}';
    const parsed = parseCoinsetMessage(frame);
    if (parsed?.type !== "block") throw new Error("not a block");
    expect(parsed.record.height).toBe(7);
    expect(parsed.record.headerHash).toBe("ab");
    expect(parsed.record.weight).toBe(340282366920938463463374607431768211455n);
    expect(parsed.record.isTransactionBlock).toBe(true);
    // Without the record (an older gateway) the frame is not a block event.
    expect(parseCoinsetMessage(frame.replace(/,"record":\{[^}]*\}/, ""))).toBeNull();
  });
  test("a nodexch peak frame also carries the header hash and the block's time", () => {
    expect(
      parseCoinsetMessage(
        '{"message":{"type":"peak","data":{"height":7,"header_hash":"0xAB","tx":true,"timestamp":1790480000}}}'
      )
    ).toEqual({ type: "peak", height: 7, tx: true, headerHash: "ab", timestamp: 1790480000 });
  });
  test("a nodexch live frame is the state a poll would return; Coinset's own live kind is not", () => {
    expect(
      parseCoinsetMessage(
        '{"message":{"type":"dashboard","data":{"kind":"live","peak_height":9295535,"mempool_size":12,"mempool_cost":140000000,"mempool_fees":"9007199254740993","synced":true}}}'
      )
    ).toEqual({
      type: "state",
      peakHeight: 9295535,
      mempoolSize: 12,
      mempoolCost: 140000000,
      mempoolFees: 9007199254740993n,
      synced: true,
    });
    expect(
      parseCoinsetMessage('{"message":{"type":"dashboard","data":{"kind":"live","tx_count":462}}}')
    ).toBeNull();
  });
  test("a nodexch mempool delta carries compact items; one entry without details voids them", () => {
    const entry = (id: string, details: boolean) => ({
      id: `0x${id}`,
      first_seen_ms: 5,
      fee_mojos: 10,
      cost: 5,
      ...(details
        ? {
            spends: 1,
            additions: [],
            removals: [{ parent_coin_info: "0x01", puzzle_hash: "0x02", amount: "@amount@" }],
            addition_count: 0,
            removal_count: 1,
            kind: "xch",
            asset_ids: [],
            assets: { xch: "9007199254740993", cats: [], nfts: 0, dids: 0, singletons: 0 },
          }
        : {}),
    });
    const frame = (added: unknown[]) =>
      JSON.stringify({
        message: {
          type: "dashboard",
          data: { kind: "mempool_delta", added, removed: ["0xAB"] },
        },
        // A bare number past 2^53, as the gateway writes a large coin.
      }).replace('"@amount@"', "9007199254740993");
    const parsed = parseCoinsetMessage(frame([entry("aa", true)]));
    if (parsed?.type !== "mempoolDelta") throw new Error("not a mempool delta");
    expect(parsed.removed).toEqual(["ab"]);
    expect(parsed.added?.map((i) => [i.id, i.kind, i.feeRate])).toEqual([["aa", "xch", 2]]);
    // Past 2^53: the digits survive the parse.
    expect(parsed.added?.[0]?.removals[0]?.amount).toBe("9007199254740993");
    const partial = parseCoinsetMessage(frame([entry("aa", true), entry("bb", false)]));
    expect(partial).toEqual({ type: "mempoolDelta", added: null, removed: ["ab"] });
  });
  test("netspace dashboard frames keep the byte count exact; other dashboard kinds are ignored", () => {
    expect(
      parseCoinsetMessage(
        '{"message":{"type":"dashboard","data":{"kind":"netspace","bytes":"3631225713031519604","difficulty":2272}}}'
      )
    ).toEqual({ type: "netspace", bytes: 3631225713031519604n, difficulty: 2272 });
    expect(
      parseCoinsetMessage('{"message":{"type":"dashboard","data":{"kind":"live","tx_count":462}}}')
    ).toBeNull();
    expect(
      parseCoinsetMessage(
        '{"message":{"type":"dashboard","data":{"kind":"netspace","bytes":"nope"}}}'
      )
    ).toBeNull();
  });
});

describe("parseCoinsetMessage: vault", () => {
  test("recovery steps carry the vault id, action, status and tx", () => {
    const event = parseCoinsetMessage(
      `{"message":{"type":"vault","data":{"vault_id":"0x${"ab".repeat(
        32
      )}","action":"initiate_recovery","status":"pending","tx_id":"0x${"cd".repeat(32)}"}}}`
    );
    expect(event).toMatchObject({
      type: "vault",
      vaultId: "ab".repeat(32),
      action: "initiate_recovery",
      status: "pending",
      txId: "cd".repeat(32),
    });
    expect(
      parseCoinsetMessage('{"message":{"type":"vault","data":{"vault_id":"nope"}}}')
    ).toBeNull();
  });
});

test("stopping aborts the poll and ignores its late result, including after restart", async () => {
  const timers = fakeTimers();
  const events: LiveEvent[] = [];
  const pending: {
    signal: AbortSignal;
    resolve: (value: { peakHeight: number; peakIsTx: boolean; mempoolSize: number }) => void;
  }[] = [];
  const stream = createLiveStream({
    wsUrl: null,
    poll: (signal) => new Promise((resolve) => pending.push({ signal, resolve })),
    onEvent: (event) => events.push(event),
    ...timers,
  });
  stream.start();
  stream.stop();
  expect(pending[0]!.signal.aborted).toBe(true);
  stream.start();
  const before = events.length;
  pending[0]!.resolve({ peakHeight: 99, peakIsTx: true, mempoolSize: 10 });
  await Promise.resolve();
  await Promise.resolve();
  expect(events.length).toBe(before);
  expect(timers.pending()).toEqual([]);
  stream.stop();
  pending[1]!.resolve({ peakHeight: 100, peakIsTx: true, mempoolSize: 10 });
  await Promise.resolve();
  expect(stream.status).toBe("offline");
});

describe("streamUrl", () => {
  test("Coinset's URL as it always was", () => {
    expect(streamUrl("wss://api.coinset.org/ws")).toBe(
      "wss://api.coinset.org/ws?events=peak,transaction,reorg,dashboard,vault"
    );
  });
  test("a nodexch key in the query survives", () => {
    expect(streamUrl("wss://api.nodexch.space/ws?key=nxp_abc")).toBe(
      "wss://api.nodexch.space/ws?key=nxp_abc&events=peak,transaction,reorg,dashboard,vault"
    );
  });
});

describe("createLiveStream: quiet polling", () => {
  const LIVE = {
    message: {
      type: "dashboard",
      data: { kind: "live", peak_height: 10, mempool_size: 3, mempool_cost: 1, mempool_fees: 0 },
    },
  };
  function start(quietPollIntervalMs?: number) {
    FakeSocket.instances = [];
    const timers = fakeTimers();
    let polls = 0;
    const stream = createLiveStream({
      wsUrl: "wss://api.nodexch.space/ws",
      poll: async () => {
        polls += 1;
        return { peakHeight: 10, peakIsTx: false, mempoolSize: 3 };
      },
      onEvent: () => undefined,
      pollIntervalMs: 1_000,
      quietPollIntervalMs,
      WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
      setTimeoutImpl: timers.setTimeoutImpl,
      clearTimeoutImpl: timers.clearTimeoutImpl,
    });
    stream.start();
    return { stream, timers, socket: () => FakeSocket.instances[0]!, polls: () => polls };
  }

  test("a socket that pushes state stretches the poll; losing it brings the short one back", async () => {
    const { stream, timers, socket, polls } = start(60_000);
    await Promise.resolve();
    socket().open();
    socket().message(LIVE);
    await timers.advance(1_000);
    expect(polls()).toBe(1);
    // Quiet from here: nothing for a minute, however many short intervals pass.
    await timers.advance(30_000);
    expect(polls()).toBe(1);
    await timers.advance(30_000);
    expect(polls()).toBe(2);
    socket().drop();
    await timers.advance(1_000);
    expect(polls()).toBe(3);
    stream.stop();
  });

  test("the first state frame also stretches the poll that was already scheduled", async () => {
    const { stream, timers, socket, polls } = start(60_000);
    await Promise.resolve();
    socket().open();
    await timers.advance(0);
    socket().message(LIVE);
    // The short poll (1 s) scheduled at start does not run.
    for (let i = 0; i < 5; i++) await timers.advance(1_000);
    expect(polls()).toBe(1);
    stream.stop();
  });

  test("an open socket without state frames (Coinset) keeps the short poll", async () => {
    const { stream, timers, socket, polls } = start(60_000);
    await Promise.resolve();
    socket().open();
    socket().message({ message: { type: "peak", data: { height: 10, tx: false } } });
    for (let i = 0; i < 3; i++) await timers.advance(1_000);
    expect(polls()).toBe(4);
    stream.stop();
  });
});
