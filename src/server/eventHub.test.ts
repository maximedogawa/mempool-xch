import { describe, expect, test } from "bun:test";
import blockchainState from "@/test-utils/fixtures/blockchain_state.json";
import mempoolItems from "@/test-utils/fixtures/mempool_items.json";
import { normaliseBlockchainState, normaliseMempoolItem } from "@/shared/lib/rpc/normalise";
import { CoinsetHub, parseCoinsetFrame, type HubEvent } from "./eventHub";
import { MempoolSyncer, REFRESH_MS } from "./mempoolSummary";

const frame = (message: unknown) => JSON.stringify({ network: "mainnet", region: "zrh", instance_id: "x", seq: 1, message });

describe("parseCoinsetFrame", () => {
  test("peak, transaction, dashboard block / mempool_delta / live / netspace, reorg", () => {
    expect(parseCoinsetFrame(frame({ type: "peak", data: { height: 5, tx: true } }))).toEqual([{ type: "peak", height: 5, tx: true }]);
    expect(parseCoinsetFrame(frame({ type: "transaction", data: { ids: ["0xAB"], status: "confirmed", height: 9 } }))).toEqual([{ type: "transaction", ids: ["ab"], status: "confirmed", height: 9 }]);
    const block = parseCoinsetFrame(frame({ type: "dashboard", data: { kind: "block", height: 9298999, header_hash: "0x51c1", timestamp_ms: 1789542342000, is_transaction_block: true, tx_count: 9, coin_spend_count: 9, total_cost: 10671395333, total_fee: 0, avg_fee_rate: 0, cost_percent: 97.01 } }));
    expect(block[0]).toMatchObject({ type: "block", stats: { height: 9298999, headerHash: "51c1", txCount: 9, totalCost: 10671395333, totalFee: "0", costPercent: 97.01 } });
    const delta = parseCoinsetFrame(frame({ type: "dashboard", data: { kind: "mempool_delta", added: [{ id: "0x53", first_seen_ms: 1789542467189, fee_mojos: 0, cost: 78922628 }], removed: ["0x32", "0x62"] } }));
    expect(delta[0]).toEqual({ type: "mempool_delta", added: [{ id: "53", firstSeenMs: 1789542467189, fee: "0", cost: 78922628 }], removed: ["32", "62"] });
    expect(parseCoinsetFrame(frame({ type: "dashboard", data: { kind: "live", tx_count: 451, total_cost: 173892149793, total_fee: 3359142964, avg_fee_rate: 0.019, backlog_blocks: 15.8 } }))[0]).toMatchObject({ type: "live", txCount: 451, totalFee: "3359142964" });
    expect(parseCoinsetFrame(frame({ type: "dashboard", data: { kind: "netspace", bytes: "3546731415399287689", difficulty: 2208 } }))[0]).toEqual({ type: "netspace", bytes: "3546731415399287689", difficulty: 2208 });
    expect(parseCoinsetFrame(frame({ type: "reorg", data: { old_peak_height: 10, new_peak_height: 9, reorg_depth: 2 } }))[0]).toEqual({ type: "reorg", oldHeight: 10, newHeight: 9, depth: 2 });
    expect(parseCoinsetFrame(frame({ type: "balance", data: {} }))).toEqual([]);
    expect(parseCoinsetFrame("nope")).toEqual([]);
  });
});

class FakeSocket {
  static instances: FakeSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }
  close() {}
  open() {
    this.onopen?.();
  }
  send(message: unknown) {
    this.onmessage?.({ data: frame(message) });
  }
  drop() {
    this.onclose?.();
  }
}

function timers() {
  const queue: { id: number; fn: () => void; at: number }[] = [];
  let now = 0;
  let nextId = 1;
  return {
    now: () => now,
    setTimeoutImpl: (fn: () => void, ms: number) => {
      const id = nextId++;
      queue.push({ id, fn, at: now + ms });
      return id as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimeoutImpl: (id: ReturnType<typeof setTimeout>) => {
      const i = queue.findIndex((q) => q.id === (id as unknown as number));
      if (i !== -1) queue.splice(i, 1);
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

const state = normaliseBlockchainState(blockchainState.blockchain_state);
const fullItems = Object.values(mempoolItems.mempool_items).map(normaliseMempoolItem);

describe("CoinsetHub", () => {
  test("subscribes, emits normalised events, caches block stats, reconnects with backoff and polls while down", async () => {
    FakeSocket.instances = [];
    const t = timers();
    const events: HubEvent[] = [];
    let polls = 0;
    const hub = new CoinsetHub("mainnet", {
      wsUrl: "wss://api.coinset.org/ws",
      poll: async () => {
        polls += 1;
        return state;
      },
      WebSocketImpl: FakeSocket as unknown as typeof WebSocket,
      setTimeoutImpl: t.setTimeoutImpl,
      clearTimeoutImpl: t.clearTimeoutImpl,
      now: t.now,
      pollIntervalMs: 1000,
    });
    hub.on((e) => events.push(e.event));
    hub.start();
    const s1 = FakeSocket.instances[0]!;
    expect(s1.url).toBe("wss://api.coinset.org/ws?events=peak,transaction,dashboard,reorg");
    s1.open();
    expect(hub.status().channel).toBe("websocket");
    s1.send({ type: "dashboard", data: { kind: "block", height: 100, header_hash: "0xaa", timestamp_ms: 1, is_transaction_block: true, tx_count: 3, coin_spend_count: 3, total_cost: 5, total_fee: 7, avg_fee_rate: 1.4, cost_percent: 0.1 } });
    s1.send({ type: "peak", data: { height: 100, tx: true } });
    s1.send({ type: "peak", data: { height: 100, tx: true } }); // duplicate peak ignored
    expect(hub.blockStats.get(100)?.txCount).toBe(3);
    expect(events.filter((e) => e.type === "peak").length).toBe(1);
    expect(hub.since(0)!.length).toBeGreaterThanOrEqual(3);
    // Drop: polling starts immediately, reconnect after backoff.
    s1.drop();
    expect(hub.status().channel).toBe("polling");
    await t.advance(0);
    expect(polls).toBe(1);
    expect(events.some((e) => e.type === "peak" && e.height === 9295519)).toBe(true);
    expect(t.pending()).toContain(1000);
    await t.advance(1000);
    const s2 = FakeSocket.instances[1]!;
    expect(s2).toBeDefined();
    s2.open();
    expect(hub.status().channel).toBe("websocket");
    expect(hub.status().reconnects).toBe(1);
    hub.stop();
  });
});

describe("event-driven MempoolSyncer", () => {
  test("applies mempool deltas without id polling and resyncs only every 5 minutes", async () => {
    const [a, b, c] = fullItems as [typeof fullItems[0], typeof fullItems[0], typeof fullItems[0]];
    let now = 1_000_000;
    const client = {
      getBlockchainState: async () => state,
      getAllMempoolTxIds: async () => [a.name, b.name],
      getMempoolItemByTxId: async (id: string) => {
        const found = fullItems.find((i) => i.name === id);
        if (!found) throw new Error("missing");
        return found;
      },
    };
    const syncer = new MempoolSyncer("mainnet", { client, now: () => now, awaitItems: true });
    await syncer.getSummary(); // initial full sync
    expect(syncer.stats.idListFetches).toBe(1);
    syncer.handleHubEvent({ type: "status", channel: "websocket" });
    await syncer.getSummary(); // resync once right after connecting
    expect(syncer.stats.idListFetches).toBe(2);
    await syncer.applyDelta([{ id: c.name, firstSeenMs: 123, fee: c.fee.toString(), cost: c.cost }], [b.name]);
    const s = syncer.snapshot();
    expect(s.items.map((i) => i.id).sort()).toEqual([a.name, c.name].sort());
    expect(s.items.find((i) => i.id === c.name)?.firstSeen).toBe(123);
    expect(syncer.stats.deltaAdded).toBe(1);
    expect(syncer.stats.deltaRemoved).toBe(1);
    // Live totals patch the state without a call.
    syncer.applyLive({ txCount: 42, totalCost: 7, totalFee: "9" });
    expect(syncer.snapshot().state.mempoolSize).toBe(42);
    // Within 5 minutes no more id-list fetches, even though REFRESH_MS passed.
    now += REFRESH_MS * 10;
    await syncer.getSummary();
    expect(syncer.stats.idListFetches).toBe(2);
    now += 5 * 60_000;
    await syncer.getSummary();
    expect(syncer.stats.idListFetches).toBe(3);
  });
});
