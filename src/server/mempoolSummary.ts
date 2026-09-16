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
import { coinsetWsUrl, getHub, hasHub, RESYNC_MS, type HubEvent, type MempoolDeltaItem } from "./eventHub";
import { RpcError } from "@/shared/lib/rpc/errors";
import type { BlockchainState } from "@/shared/lib/rpc/types";

export const REFRESH_MS = 3_000;
/** Background refresh keeps running this long after the last client request, then idles. */
export const IDLE_AFTER_MS = 2 * 60_000;
/** How many unseen items to fetch per refresh; the rest arrive on the next tick. */
const FETCH_BATCH = 80;
const FETCH_CONCURRENCY = 12;
/**
 * get_blockchain_state.mempool_min_fees.cost_5000000 is Mempool.get_min_fee_rate(5_000_000): the
 * fee rate in mojos per cost a 5M-cost spend must beat to enter a full mempool (0 while there is
 * room). It is already a rate, not an amount.
 */
const MIN_FEE_TIER_KEY = "cost_5000000";

export interface SyncerDeps {
  client: Pick<RpcClient, "getBlockchainState" | "getAllMempoolTxIds" | "getMempoolItemByTxId">;
  now?: () => number;
  /** Keep refreshing in the background between requests (off in unit tests). */
  backgroundLoop?: boolean;
  /** Await item fetches inside refresh() (tests); production answers before they finish. */
  awaitItems?: boolean;
}

export function stateSummary(state: BlockchainState): MempoolStateSummary {
  const minFeeRate = state.mempoolMinFees[MIN_FEE_TIER_KEY] ?? 0;
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
    minFeeRate,
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
  /** True while a push channel (WebSocket / webhook) feeds mempool deltas; polling then only resyncs every RESYNC_MS. */
  private eventDriven = false;
  readonly stats = { itemFetches: 0, idListFetches: 0, stateFetches: 0, deltas: 0, deltaAdded: 0, deltaRemoved: 0 };

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
    const stale = this.now() - this.lastRefresh >= this.refreshInterval();
    if (stale) await this.refresh();
    this.ensureLoop();
    return this.snapshot();
  }

  /** Full id-list refresh cadence: every 3 s when polling, every 5 min when events drive the view. */
  private refreshInterval(): number {
    return this.eventDriven ? RESYNC_MS : REFRESH_MS;
  }

  /** Switch between event-driven (push) and polling operation; a reconnect forces a resync. */
  setEventDriven(on: boolean): void {
    if (on && !this.eventDriven) this.lastRefresh = 0; // resync once after (re)connecting
    this.eventDriven = on;
  }

  /** Apply a Coinset mempool_delta: fetch only the added bundles, drop the removed ones. */
  async applyDelta(added: MempoolDeltaItem[], removed: string[]): Promise<void> {
    this.stats.deltas += 1;
    removed.forEach((id) => {
      if (this.items.delete(id)) this.stats.deltaRemoved += 1;
      this.pending.delete(id);
    });
    const fresh = added.filter((a) => !this.items.has(a.id));
    await mapWithConcurrency(fresh, FETCH_CONCURRENCY, async (a) => {
      try {
        const item = await this.deps.client.getMempoolItemByTxId(a.id);
        this.stats.itemFetches += 1;
        this.stats.deltaAdded += 1;
        this.items.set(a.id, compactMempoolItem(item, a.firstSeenMs ?? this.now()));
        this.pending.delete(a.id);
      } catch {
        this.pending.add(a.id);
      }
    });
    if (this.state) this.state = { ...this.state, mempoolSize: this.items.size };
  }

  /** Apply Coinset's live totals (tx count, cost, fees) without a state call. */
  applyLive(live: { txCount: number; totalCost: number; totalFee: string }): void {
    if (!this.state) return;
    this.state = { ...this.state, mempoolSize: live.txCount, mempoolCost: live.totalCost, mempoolFees: live.totalFee };
  }

  /** Refresh only the chain state (one get_blockchain_state), e.g. on a new peak. */
  async refreshState(): Promise<void> {
    try {
      const state = await this.deps.client.getBlockchainState();
      this.stats.stateFetches += 1;
      this.state = stateSummary(state);
    } catch {
      // Keep the last state; the next peak retries.
    }
  }

  /** Route a hub event into the syncer. */
  handleHubEvent(event: HubEvent): void {
    if (event.type === "mempool_delta") void this.applyDelta(event.added, event.removed);
    else if (event.type === "live") this.applyLive(event);
    else if (event.type === "peak") void this.refreshState();
    else if (event.type === "status") this.setEventDriven(event.channel === "websocket" || event.channel === "webhook");
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
      this.loop = setTimeout(tick, this.pending.size > 0 ? 250 : this.refreshInterval());
    };
    this.loop = setTimeout(tick, this.pending.size > 0 ? 250 : this.refreshInterval());
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

  /** Until when Coinset asked us to back off (HTTP 429), as a timestamp. */
  private backoffUntil = 0;

  private async doRefresh(): Promise<void> {
    if (this.now() < this.backoffUntil) return;
    try {
      await this.doRefreshInner();
    } catch (error) {
      if (error instanceof RpcError && error.kind === "http" && error.status === 429) {
        this.backoffUntil = this.now() + 30_000;
      }
      throw error;
    }
  }

  private async doRefreshInner(): Promise<void> {
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
    this.lastRefresh = this.now();
    // Item fetches are the slow part (one round trip each). They are not awaited by the
    // request that triggered the refresh: the first response carries the state and whatever
    // items are already known, and the background loop fills in the rest within seconds.
    const fetching = mapWithConcurrency(batch, FETCH_CONCURRENCY, async (id) => {
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
    this.itemFetch = fetching.then(() => {
      this.itemFetch = null;
    });
    if (this.deps.awaitItems) await fetching;
  }

  /** In-flight item fetches, exposed so tests can wait for them. */
  private itemFetch: Promise<void> | null = null;

  /** Wait for background item fetches (tests). */
  settle(): Promise<void> {
    return this.itemFetch ?? Promise.resolve();
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
  const key = process.env.COINSET_API_KEY?.trim();
  const client = createRpcClient({ rpcUrl, indexedUrl: null, timeoutMs: 15_000, headers: key ? { authorization: `Bearer ${key}` } : {} });
  const syncer = new MempoolSyncer(network, { client, backgroundLoop: true });
  registry.set(network, syncer);
  // One Coinset subscription per network drives the syncer (decision-006).
  if (!hasHub(network)) {
    const hub = getHub(network, { wsUrl: coinsetWsUrl(network, rpcUrl), poll: () => client.getBlockchainState() });
    hub.on((e) => syncer.handleHubEvent(e.event));
    hub.start();
  } else {
    getHub(network).on((e) => syncer.handleHubEvent(e.event));
  }
  return syncer;
}
