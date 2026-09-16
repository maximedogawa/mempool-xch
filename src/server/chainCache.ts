/**
 * Server-side chain cache (TASK-034, decision-006): blockchain state, the recent block records
 * and the reference fee estimate for one network, refreshed by hub events (peak, reorg) with
 * slow safety timers, so every browser reads /api/<network>/chain instead of calling Coinset.
 */
import type { NetworkId } from "@/shared/config/networks";
import { CHIA } from "@/shared/config/networks";
import type { BlockStats, ChainSnapshot } from "@/shared/lib/chain/types";
import type { BlockchainState, BlockRecord, FeeEstimate } from "@/shared/lib/rpc/types";
import type { CoinsetHub, HubEvent } from "./eventHub";

export const RECORDS_KEEP = 80;
export const STATE_SAFETY_MS = 30_000;
export const FEE_SAFETY_MS = 60_000;
const FEE_MIN_GAP_MS = 5_000;
const STATE_MIN_GAP_MS = 1_000;

export interface ChainCacheDeps {
  client: {
    getBlockchainState: (signal?: AbortSignal) => Promise<BlockchainState>;
    getBlockRecords: (start: number, end: number, signal?: AbortSignal) => Promise<BlockRecord[]>;
    getFeeEstimate: (cost: number, targetTimes: number[], signal?: AbortSignal) => Promise<FeeEstimate>;
  };
  hub: Pick<CoinsetHub, "on" | "status" | "blockStats">;
  feeCost?: number;
  feeTargets?: number[];
  now?: () => number;
  setTimeoutImpl?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeoutImpl?: (id: ReturnType<typeof setTimeout>) => void;
  /** Disable the safety timers (tests). */
  timers?: boolean;
}

export class ChainCache {
  private state: BlockchainState | null = null;
  private stateAt = 0;
  private fee: FeeEstimate | null = null;
  private feeAt = 0;
  private readonly records = new Map<number, BlockRecord>();
  private inflightState: Promise<void> | null = null;
  private inflightFee: Promise<void> | null = null;
  private inflightRecords: Promise<void> | null = null;
  private inflightAll: Promise<void> | null = null;
  private stateTimer: ReturnType<typeof setTimeout> | null = null;
  private feeTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;
  readonly counters: Record<string, number> = {};

  constructor(
    readonly network: NetworkId,
    private readonly deps: ChainCacheDeps
  ) {}

  private now(): number {
    return this.deps.now ? this.deps.now() : Date.now();
  }
  private count(key: string): void {
    this.counters[key] = (this.counters[key] ?? 0) + 1;
  }

  start(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.deps.hub.on((e) => this.handle(e.event));
    void this.refreshAll();
    if (this.deps.timers !== false) this.armTimers();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    const clear = this.deps.clearTimeoutImpl ?? ((id: ReturnType<typeof setTimeout>) => clearTimeout(id));
    if (this.stateTimer !== null) clear(this.stateTimer);
    if (this.feeTimer !== null) clear(this.feeTimer);
    this.stateTimer = this.feeTimer = null;
  }

  private armTimers(): void {
    const setT = this.deps.setTimeoutImpl ?? ((fn: () => void, ms: number) => setTimeout(fn, ms));
    const tickState = () => {
      if (this.now() - this.stateAt >= STATE_SAFETY_MS - 500) void this.refreshState(true);
      this.stateTimer = setT(tickState, STATE_SAFETY_MS);
    };
    const tickFee = () => {
      if (this.now() - this.feeAt >= FEE_SAFETY_MS - 500) void this.refreshFee(true);
      this.feeTimer = setT(tickFee, FEE_SAFETY_MS);
    };
    this.stateTimer = setT(tickState, STATE_SAFETY_MS);
    this.feeTimer = setT(tickFee, FEE_SAFETY_MS);
  }

  /** Hub events drive refreshes: a peak refreshes state + records (+ fee on transaction blocks). */
  handle(event: HubEvent): void {
    if (event.type === "peak") {
      void this.refreshState().then(() => this.refreshRecords(event.height));
      if (event.tx) void this.refreshFee();
    } else if (event.type === "reorg") {
      [...this.records.keys()].filter((h) => h >= event.newHeight - event.depth).forEach((h) => this.records.delete(h));
      void this.refreshState().then(() => this.refreshRecords(event.newHeight, true));
    } else if (event.type === "status" && (event.channel === "websocket" || event.channel === "webhook")) {
      // Back from a gap: make sure nothing was missed.
      void this.refreshAll();
    }
  }

  async refreshAll(): Promise<void> {
    if (this.inflightAll) return this.inflightAll;
    this.inflightAll = (async () => {
      try {
        await this.refreshState(true);
        const peak = this.state?.peak.height;
        if (peak !== undefined) await this.refreshRecords(peak, true);
        await this.refreshFee(true);
      } finally {
        this.inflightAll = null;
      }
    })();
    return this.inflightAll;
  }

  async refreshState(force = false): Promise<void> {
    if (!force && this.now() - this.stateAt < STATE_MIN_GAP_MS) return;
    if (this.inflightState) return this.inflightState;
    this.inflightState = (async () => {
      try {
        this.state = await this.deps.client.getBlockchainState();
        this.stateAt = this.now();
        this.count("state");
      } catch {
        this.count("state_failures");
      } finally {
        this.inflightState = null;
      }
    })();
    return this.inflightState;
  }

  async refreshFee(force = false): Promise<void> {
    if (!force && this.now() - this.feeAt < FEE_MIN_GAP_MS) return;
    if (this.inflightFee) return this.inflightFee;
    this.inflightFee = (async () => {
      try {
        this.fee = await this.deps.client.getFeeEstimate(this.deps.feeCost ?? CHIA.REFERENCE_SPEND_COST, this.deps.feeTargets ?? [60, 300, 600]);
        this.feeAt = this.now();
        this.count("fee");
      } catch {
        this.count("fee_failures");
      } finally {
        this.inflightFee = null;
      }
    })();
    return this.inflightFee;
  }

  /** Fetch the records between the newest known height and `peak` (bounded by RECORDS_KEEP). */
  async refreshRecords(peak: number, full = false): Promise<void> {
    if (this.inflightRecords) {
      await this.inflightRecords;
      if (this.records.has(peak) && !full) return;
    }
    const newest = this.records.size ? Math.max(...this.records.keys()) : -1;
    const start = full || newest < 0 || peak - newest > RECORDS_KEEP ? Math.max(0, peak + 1 - RECORDS_KEEP) : newest + 1;
    if (start > peak) return;
    this.inflightRecords = (async () => {
      try {
        const records = await this.deps.client.getBlockRecords(start, peak + 1);
        records.forEach((r) => this.records.set(r.height, r));
        while (this.records.size > RECORDS_KEEP) this.records.delete(Math.min(...this.records.keys()));
        this.count("records");
      } catch {
        this.count("records_failures");
      } finally {
        this.inflightRecords = null;
      }
    })();
    return this.inflightRecords;
  }

  get ready(): boolean {
    return this.state !== null;
  }

  /** Newest first. */
  recentBlocks(limit = RECORDS_KEEP): BlockRecord[] {
    return [...this.records.values()].sort((a, b) => b.height - a.height).slice(0, limit);
  }

  snapshot(limit = RECORDS_KEEP): ChainSnapshot | null {
    if (!this.state) return null;
    const blocks = this.recentBlocks(limit);
    const stats: BlockStats[] = blocks.map((b) => this.deps.hub.blockStats.get(b.height)).filter((s): s is BlockStats => s !== undefined);
    return {
      network: this.network,
      generatedAt: this.now(),
      channel: this.deps.hub.status().channel,
      state: this.state,
      blocks,
      stats,
      fee: this.fee ? { cost: this.deps.feeCost ?? CHIA.REFERENCE_SPEND_COST, estimate: this.fee } : null,
    };
  }
}

/* ---- registry ---- */

const caches = new Map<NetworkId, ChainCache>();

export function getChainCache(network: NetworkId, deps?: ChainCacheDeps): ChainCache {
  const existing = caches.get(network);
  if (existing) return existing;
  if (!deps) throw new Error("chain cache deps required on first use");
  const cache = new ChainCache(network, deps);
  caches.set(network, cache);
  cache.start();
  return cache;
}
