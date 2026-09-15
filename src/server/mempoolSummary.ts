/**
 * Server-side mempool summary (TASK-025, decision-004). One in-memory syncer per network keeps
 * a compact view of the Coinset mempool: it polls get_all_mempool_tx_ids (a few KB), fetches
 * only unseen items with get_mempool_item_by_tx_id, drops ids that disappeared, and never
 * downloads the 17 MB get_all_mempool_items dump in steady state. Refreshes are throttled to
 * one per REFRESH_MS regardless of how many clients ask.
 */
import { isCoinsetUrl, NETWORKS, type NetworkId } from "@/shared/config/networks";
import { compactMempoolItem } from "@/shared/lib/mempool/compact";
import type { CompactMempoolItem, MempoolStateSummary, MempoolSummary } from "@/shared/lib/mempool/types";
import { createRpcClient, type RpcClient } from "@/shared/lib/rpc/client";
import type { BlockchainState } from "@/shared/lib/rpc/types";

export const REFRESH_MS = 3_000;
/** Background refresh keeps running this long after the last client request, then idles. */
export const IDLE_AFTER_MS = 2 * 60_000;
/** How many unseen items to fetch per refresh; the rest arrive on the next tick. */
const FETCH_BATCH = 40;
const FETCH_CONCURRENCY = 8;
/** Coinset's mempool_min_fees tier key (cost bucket). */
const MIN_FEE_TIER_COST = 5_000_000;

export interface SyncerDeps {
  client: Pick<RpcClient, "getBlockchainState" | "getAllMempoolTxIds" | "getMempoolItemByTxId">;
  now?: () => number;
  /** Keep refreshing in the background between requests (off in unit tests). */
  backgroundLoop?: boolean;
}

export function stateSummary(state: BlockchainState): MempoolStateSummary {
  const minFeeTier = state.mempoolMinFees[`cost_${MIN_FEE_TIER_COST}`] ?? 0;
  return {
    peakHeight: state.peak.height,
    peakHash: state.peak.headerHash,
    lastTxBlockHeight: state.peak.isTransactionBlock ? state.peak.height : state.peak.prevTransactionBlockHeight,
    mempoolSize: state.mempoolSize,
    mempoolCost: state.mempoolCost,
    mempoolMaxTotalCost: state.mempoolMaxTotalCost,
    mempoolFees: state.mempoolFees.toString(),
    blockMaxCost: state.blockMaxCost,
    averageBlockTime: state.averageBlockTime,
    minFeeRate: minFeeTier / MIN_FEE_TIER_COST,
    synced: state.synced,
  };
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    const next = async (): Promise<void> => {
      const item = queue.shift();
      if (item === undefined) return;
      results.push(await fn(item));
      return next();
    };
    return next();
  });
  await Promise.all(workers);
  return results;
}

export class MempoolSyncer {
  private items = new Map<string, CompactMempoolItem>();
  private state: MempoolStateSummary | null = null;
  private lastRefresh = 0;
  private inflight: Promise<void> | null = null;
  /** Ids Coinset listed but whose item fetch failed; retried on later ticks. */
  private pending = new Set<string>();
  private lastRequest = 0;
  private loop: ReturnType<typeof setTimeout> | null = null;
  readonly stats = { itemFetches: 0, idListFetches: 0, stateFetches: 0 };

  constructor(
    readonly network: NetworkId,
    private readonly deps: SyncerDeps
  ) {}

  private now(): number {
    return this.deps.now ? this.deps.now() : Date.now();
  }

  /**
   * Returns the current summary, refreshing first if the last refresh is older than REFRESH_MS.
   * Also (re)starts the background loop so later requests are answered from memory.
   */
  async getSummary(): Promise<MempoolSummary> {
    this.lastRequest = this.now();
    const stale = this.now() - this.lastRefresh >= REFRESH_MS;
    if (stale) await this.refresh();
    this.ensureLoop();
    return this.snapshot();
  }

  /** Background refresh every REFRESH_MS while clients are active; stops after IDLE_AFTER_MS. */
  private ensureLoop(): void {
    if (this.loop !== null || !this.deps.backgroundLoop) return;
    const tick = async () => {
      this.loop = null;
      if (this.now() - this.lastRequest > IDLE_AFTER_MS) return;
      try {
        await this.refresh();
      } catch {
        // Transient upstream error: the next tick retries.
      }
      this.loop = setTimeout(tick, REFRESH_MS);
    };
    this.loop = setTimeout(tick, REFRESH_MS);
  }

  snapshot(): MempoolSummary {
    return {
      network: this.network,
      generatedAt: this.lastRefresh,
      source: "server",
      state: this.state ?? emptyState(),
      items: [...this.items.values()],
    };
  }

  /** Coalesces concurrent refreshes into one. */
  refresh(): Promise<void> {
    if (!this.inflight) {
      this.inflight = this.doRefresh().finally(() => {
        this.inflight = null;
      });
    }
    return this.inflight;
  }

  private async doRefresh(): Promise<void> {
    const [state, ids] = await Promise.all([
      this.deps.client.getBlockchainState().then((s) => {
        this.stats.stateFetches += 1;
        return s;
      }),
      this.deps.client.getAllMempoolTxIds().then((list) => {
        this.stats.idListFetches += 1;
        return list;
      }),
    ]);
    this.state = stateSummary(state);
    const live = new Set(ids);
    [...this.items.keys()].filter((id) => !live.has(id)).forEach((id) => this.items.delete(id));
    [...this.pending].filter((id) => !live.has(id)).forEach((id) => this.pending.delete(id));
    const unseen = ids.filter((id) => !this.items.has(id));
    unseen.forEach((id) => this.pending.add(id));
    const batch = [...this.pending].slice(0, FETCH_BATCH);
    const seenAt = this.now();
    await mapWithConcurrency(batch, FETCH_CONCURRENCY, async (id) => {
      try {
        const item = await this.deps.client.getMempoolItemByTxId(id);
        this.stats.itemFetches += 1;
        this.items.set(id, compactMempoolItem(item, seenAt));
        this.pending.delete(id);
      } catch {
        // Item may have been confirmed between the id listing and the fetch; it will be
        // dropped when it disappears from the next id list, or retried otherwise.
      }
    });
    this.lastRefresh = this.now();
  }

  get pendingCount(): number {
    return this.pending.size;
  }
}

function emptyState(): MempoolStateSummary {
  return {
    peakHeight: 0,
    peakHash: "",
    lastTxBlockHeight: 0,
    mempoolSize: 0,
    mempoolCost: 0,
    mempoolMaxTotalCost: 110_000_000_000,
    mempoolFees: "0",
    blockMaxCost: 11_000_000_000,
    averageBlockTime: 18.75,
    minFeeRate: 0,
    synced: false,
  };
}

/* ---- process-wide registry (one syncer per network) ---- */

const registry = new Map<NetworkId, MempoolSyncer>();

export function getSyncer(network: NetworkId): MempoolSyncer {
  const existing = registry.get(network);
  if (existing) return existing;
  const config = NETWORKS[network];
  const rpcUrl = process.env[`MEMPOOL_RPC_URL_${network.toUpperCase()}`] ?? config.rpcUrl;
  if (!isCoinsetUrl(network, rpcUrl)) {
    throw new Error(`Summary API only proxies Coinset hosts; refusing ${rpcUrl}`);
  }
  const client = createRpcClient({ rpcUrl, indexedUrl: null, timeoutMs: 15_000 });
  const syncer = new MempoolSyncer(network, { client, backgroundLoop: true });
  registry.set(network, syncer);
  return syncer;
}
