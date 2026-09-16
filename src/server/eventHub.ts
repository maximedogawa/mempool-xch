/**
 * Server-side Coinset event hub (TASK-033, decision-006): one WebSocket per network subscribed to
 * `peak,transaction,dashboard`, with exponential reconnect and polling only while disconnected.
 * It normalises Coinset's frames into HubEvents, keeps a replay ring for server-sent events,
 * caches per-block statistics from `dashboard` block events, and drives the mempool syncer with
 * `mempool_delta` events so the server never polls the mempool id list in steady state.
 */
import { NETWORKS, type NetworkId } from "@/shared/config/networks";
import { backoffDelay, BACKOFF_MAX_MS } from "@/shared/lib/live/stream";
import type { BlockStats, ChainChannel } from "@/shared/lib/chain/types";
import type { BlockchainState } from "@/shared/lib/rpc/types";

export type HubChannel = ChainChannel;
export type { BlockStats };

export interface MempoolDeltaItem {
  id: string;
  firstSeenMs: number | null;
  fee: string;
  cost: number;
}

export type HubEvent =
  | { type: "peak"; height: number; tx: boolean }
  | { type: "transaction"; ids: string[]; status: "pending" | "confirmed" | "removed"; height: number | null }
  | { type: "block"; stats: BlockStats }
  | { type: "mempool_delta"; added: MempoolDeltaItem[]; removed: string[] }
  | { type: "live"; txCount: number; totalCost: number; totalFee: string; avgFeeRate: number; backlogBlocks: number }
  | { type: "netspace"; bytes: string; difficulty: number }
  | { type: "reorg"; oldHeight: number; newHeight: number; depth: number }
  /** The server's chain cache caught up with a peak (records, and later asset totals). */
  | { type: "chain"; height: number; assets: boolean }
  | { type: "status"; channel: HubChannel };

export interface SequencedEvent {
  seq: number;
  at: number;
  event: HubEvent;
}

export interface HubStatus {
  network: NetworkId;
  /** Channel currently carrying events (webhook while deliveries flow, else the socket state). */
  channel: HubChannel;
  /** State of the WebSocket regardless of webhooks. */
  socket: HubChannel;
  lastWebhookAt: number | null;
  connectedAt: number | null;
  lastEventAt: number | null;
  reconnects: number;
  counters: Record<string, number>;
  seq: number;
}

export interface HubDeps {
  wsUrl: string | null;
  poll: () => Promise<BlockchainState>;
  WebSocketImpl?: typeof WebSocket;
  setTimeoutImpl?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeoutImpl?: (id: ReturnType<typeof setTimeout>) => void;
  now?: () => number;
  pollIntervalMs?: number;
  ringSize?: number;
}

type Raw = Record<string, unknown>;
const asRaw = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const hex = (v: unknown): string => String(v ?? "").replace(/^0x/, "").toLowerCase();
const num = (v: unknown, fallback = 0): number => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v !== "" && Number.isFinite(Number(v)) ? Number(v) : fallback);
const big = (v: unknown): string => {
  try {
    return BigInt(typeof v === "number" ? Math.trunc(v) : String(v ?? "0").split(".")[0] || "0").toString();
  } catch {
    return "0";
  }
};

/** Parse one Coinset frame into zero or more hub events (pure). */
export function parseCoinsetFrame(raw: string): HubEvent[] {
  let envelope: Raw;
  try {
    envelope = asRaw(JSON.parse(raw));
  } catch {
    return [];
  }
  const message = asRaw(envelope.message);
  const data = asRaw(message.data);
  switch (message.type) {
    case "peak": {
      const height = num(data.height, -1);
      return height >= 0 ? [{ type: "peak", height, tx: Boolean(data.tx) }] : [];
    }
    case "transaction": {
      const ids = Array.isArray(data.ids) ? data.ids.map(hex) : [];
      const status = data.status === "confirmed" || data.status === "removed" ? data.status : "pending";
      return [{ type: "transaction", ids, status, height: typeof data.height === "number" ? data.height : null }];
    }
    case "reorg":
      return [{ type: "reorg", oldHeight: num(data.old_peak_height), newHeight: num(data.new_peak_height), depth: num(data.reorg_depth) }];
    case "dashboard": {
      switch (data.kind) {
        case "block":
          return [
            {
              type: "block",
              stats: {
                height: num(data.height),
                headerHash: hex(data.header_hash),
                timestampMs: typeof data.timestamp_ms === "number" ? data.timestamp_ms : null,
                isTransactionBlock: Boolean(data.is_transaction_block),
                txCount: num(data.tx_count),
                coinSpendCount: num(data.coin_spend_count),
                totalCost: num(data.total_cost),
                totalFee: big(data.total_fee),
                avgFeeRate: num(data.avg_fee_rate),
                costPercent: num(data.cost_percent),
              },
            },
          ];
        case "mempool_delta":
          return [
            {
              type: "mempool_delta",
              added: (Array.isArray(data.added) ? data.added : []).map((a) => {
                const r = asRaw(a);
                return { id: hex(r.id), firstSeenMs: typeof r.first_seen_ms === "number" ? r.first_seen_ms : null, fee: big(r.fee_mojos), cost: num(r.cost) };
              }),
              removed: (Array.isArray(data.removed) ? data.removed : []).map(hex),
            },
          ];
        case "live":
          return [{ type: "live", txCount: num(data.tx_count), totalCost: num(data.total_cost), totalFee: big(data.total_fee), avgFeeRate: num(data.avg_fee_rate), backlogBlocks: num(data.backlog_blocks) }];
        case "netspace":
          return [{ type: "netspace", bytes: big(data.bytes), difficulty: num(data.difficulty) }];
        default:
          return [];
      }
    }
    default:
      return [];
  }
}

export const RESYNC_MS = 5 * 60_000;
/** A webhook delivery keeps the "webhook" channel reported for this long. */
export const WEBHOOK_FRESH_MS = 60_000;
const BLOCK_STATS_KEEP = 120;

export class CoinsetHub {
  private socket: WebSocket | null = null;
  private stopped = true;
  private failures = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<(e: SequencedEvent) => void>();
  private ring: SequencedEvent[] = [];
  private seq = 0;
  private channel: HubChannel = "connecting";
  private connectedAt: number | null = null;
  private lastEventAt: number | null = null;
  private lastPeak: number | null = null;
  private lastWebhookAt: number | null = null;
  private reconnects = 0;
  readonly counters: Record<string, number> = {};
  readonly blockStats = new Map<number, BlockStats>();

  constructor(
    readonly network: NetworkId,
    private readonly deps: HubDeps
  ) {}

  private now(): number {
    return this.deps.now ? this.deps.now() : Date.now();
  }
  private setT(fn: () => void, ms: number) {
    return (this.deps.setTimeoutImpl ?? ((f: () => void, m: number) => setTimeout(f, m)))(fn, ms);
  }
  private clearT(id: ReturnType<typeof setTimeout>) {
    (this.deps.clearTimeoutImpl ?? ((i: ReturnType<typeof setTimeout>) => clearTimeout(i)))(id);
  }

  /** Webhook deliveries count as a live channel while they keep arriving. */
  get webhookFresh(): boolean {
    return this.lastWebhookAt !== null && this.now() - this.lastWebhookAt < WEBHOOK_FRESH_MS;
  }

  get connected(): boolean {
    return this.channel === "websocket" || this.webhookFresh;
  }

  /** Reported channel: webhook while deliveries flow (the socket stays as backup), else the socket state. */
  get activeChannel(): HubChannel {
    return this.webhookFresh ? "webhook" : this.channel;
  }

  status(): HubStatus {
    return { network: this.network, channel: this.activeChannel, socket: this.channel, lastWebhookAt: this.lastWebhookAt, connectedAt: this.connectedAt, lastEventAt: this.lastEventAt, reconnects: this.reconnects, counters: { ...this.counters }, seq: this.seq };
  }

  on(listener: (e: SequencedEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Events after `seq` still in the replay ring (for Last-Event-ID); null when too old. */
  since(seq: number): SequencedEvent[] | null {
    if (this.ring.length === 0) return [];
    if ((this.ring[0]?.seq ?? 0) > seq + 1) return null;
    return this.ring.filter((e) => e.seq > seq);
  }

  /** Feed an event from any channel (socket, webhook, poll). */
  emit(event: HubEvent, source: HubChannel | "internal" = "internal"): void {
    if (event.type === "peak") {
      if (this.lastPeak === event.height) return;
      this.lastPeak = event.height;
    }
    if (event.type === "block") {
      this.blockStats.set(event.stats.height, event.stats);
      if (this.blockStats.size > BLOCK_STATS_KEEP) {
        const oldest = Math.min(...this.blockStats.keys());
        this.blockStats.delete(oldest);
      }
    }
    if (source === "webhook") this.lastWebhookAt = this.now();
    if (event.type !== "status") {
      this.lastEventAt = this.now();
      this.counters[event.type] = (this.counters[event.type] ?? 0) + 1;
      if (source !== "internal") this.counters[`via_${source}`] = (this.counters[`via_${source}`] ?? 0) + 1;
    }
    const sequenced: SequencedEvent = { seq: ++this.seq, at: this.now(), event };
    this.ring.push(sequenced);
    if (this.ring.length > (this.deps.ringSize ?? 200)) this.ring.shift();
    this.listeners.forEach((l) => {
      try {
        l(sequenced);
      } catch {
        // A failing listener must not break the others.
      }
    });
  }

  private setChannel(channel: HubChannel): void {
    if (this.channel === channel) return;
    this.channel = channel;
    this.emit({ type: "status", channel });
  }

  start(): void {
    if (!this.stopped) return;
    this.stopped = false;
    this.failures = 0;
    if (this.deps.wsUrl && (this.deps.WebSocketImpl ?? (typeof WebSocket !== "undefined" ? WebSocket : undefined))) this.connect();
    else {
      this.setChannel("polling");
      this.schedulePoll(0);
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer !== null) this.clearT(this.reconnectTimer);
    if (this.pollTimer !== null) this.clearT(this.pollTimer);
    this.reconnectTimer = null;
    this.pollTimer = null;
    const ws = this.socket;
    this.socket = null;
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    this.setChannel("connecting");
  }

  private connect(): void {
    if (this.stopped || !this.deps.wsUrl) return;
    const WS = this.deps.WebSocketImpl ?? WebSocket;
    this.setChannel("connecting");
    let ws: WebSocket;
    try {
      ws = new WS(`${this.deps.wsUrl}?events=peak,transaction,dashboard,reorg`);
    } catch {
      this.onSocketFailure();
      return;
    }
    this.socket = ws;
    ws.onopen = () => {
      const wasDown = this.failures > 0;
      this.failures = 0;
      this.connectedAt = this.now();
      if (wasDown) this.reconnects += 1;
      if (this.pollTimer !== null) {
        this.clearT(this.pollTimer);
        this.pollTimer = null;
      }
      this.setChannel("websocket");
      this.emit({ type: "status", channel: "websocket" });
    };
    ws.onmessage = (event) => {
      parseCoinsetFrame(String(event.data)).forEach((e) => this.emit(e, "websocket"));
    };
    ws.onerror = () => {
      // onclose follows.
    };
    ws.onclose = () => {
      if (this.socket !== ws) return;
      this.socket = null;
      this.connectedAt = null;
      this.onSocketFailure();
    };
  }

  private onSocketFailure(): void {
    if (this.stopped) return;
    this.failures += 1;
    this.setChannel("polling");
    this.schedulePoll(0);
    const delay = Math.min(BACKOFF_MAX_MS, backoffDelay(this.failures));
    this.reconnectTimer = this.setT(() => this.connect(), delay);
  }

  private schedulePoll(delay: number): void {
    if (this.stopped || this.connected) return;
    if (this.pollTimer !== null) this.clearT(this.pollTimer);
    this.pollTimer = this.setT(() => void this.runPoll(), delay);
  }

  private async runPoll(): Promise<void> {
    if (this.stopped || this.connected) return;
    try {
      const state = await this.deps.poll();
      this.emit({ type: "peak", height: state.peak.height, tx: state.peak.isTransactionBlock }, "polling");
      this.emit({ type: "live", txCount: state.mempoolSize, totalCost: state.mempoolCost, totalFee: state.mempoolFees.toString(), avgFeeRate: 0, backlogBlocks: state.mempoolCost / Math.max(1, state.blockMaxCost) }, "polling");
    } catch {
      this.counters.poll_failures = (this.counters.poll_failures ?? 0) + 1;
    }
    this.schedulePoll(this.deps.pollIntervalMs ?? 10_000);
  }
}

/* ---- registry ---- */

const hubs = new Map<NetworkId, CoinsetHub>();

export function getHub(network: NetworkId, deps?: HubDeps): CoinsetHub {
  const existing = hubs.get(network);
  if (existing) return existing;
  if (!deps) throw new Error("hub deps required on first use");
  const hub = new CoinsetHub(network, deps);
  hubs.set(network, hub);
  return hub;
}

export function hasHub(network: NetworkId): boolean {
  return hubs.has(network);
}

export function coinsetWsUrl(network: NetworkId, rpcUrl: string): string | null {
  const config = NETWORKS[network];
  return config.coinsetHosts.includes(new URL(rpcUrl).host) ? config.wsUrl : null;
}
