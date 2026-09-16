import { describe, expect, test } from "bun:test";
import blockchainState from "@/test-utils/fixtures/blockchain_state.json";
import mempoolItems from "@/test-utils/fixtures/mempool_items.json";
import { normaliseBlockchainState, normaliseMempoolItem } from "@/shared/lib/rpc/normalise";
import { RpcError } from "@/shared/lib/rpc/errors";
import { MempoolSyncer, REFRESH_MS, stateSummary } from "./mempoolSummary";

const fullItems = Object.values(mempoolItems.mempool_items).map(normaliseMempoolItem);
const state = normaliseBlockchainState(blockchainState.blockchain_state);

function makeSyncer(initialIds: string[]) {
  let ids = initialIds;
  let now = 1_000_000;
  const client = {
    getBlockchainState: async () => state,
    getAllMempoolTxIds: async () => ids,
    getMempoolItemByTxId: async (id: string) => {
      const found = fullItems.find((i) => i.name === id);
      if (!found) throw new RpcError("not_found", "get_mempool_item_by_tx_id", "missing");
      return found;
    },
  };
  const syncer = new MempoolSyncer("mainnet", { client, now: () => now, awaitItems: true });
  return {
    syncer,
    setIds: (next: string[]) => {
      ids = next;
    },
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("convergence", () => {
  test("a 150-item mempool is fully summarised within two refresh cycles", async () => {
    const base = fullItems[0]!;
    const ids = Array.from({ length: 150 }, (_, i) => `${i.toString(16).padStart(4, "0")}${"ab".repeat(30)}`);
    let now = 5_000_000;
    const client = {
      getBlockchainState: async () => state,
      getAllMempoolTxIds: async () => ids,
      getMempoolItemByTxId: async (id: string) => ({ ...base, name: id }),
    };
    const syncer = new MempoolSyncer("mainnet", { client, now: () => now, awaitItems: true });
    await syncer.getSummary();
    now += REFRESH_MS;
    const second = await syncer.getSummary();
    expect(second.items.length).toBe(150);
    expect(second.items.length).toBe(second.state.mempoolSize === 74 ? 150 : second.items.length);
  });
});

describe("stateSummary", () => {
  test("derives min fee rate and last tx block", () => {
    const s = stateSummary(state);
    expect(s.peakHeight).toBe(9295519);
    expect(s.minFeeRate).toBe(0);
    expect(s.lastTxBlockHeight).toBe(state.peak.prevTransactionBlockHeight);
    expect(s.mempoolFees).toBe("511752094");
  });
});

describe("MempoolSyncer", () => {
  test("fetches each item once, drops vanished ids and caches within the refresh window", async () => {
    const [a, b, c] = fullItems.map((i) => i.name) as [string, string, string];
    const { syncer, setIds, advance } = makeSyncer([a, b]);
    const first = await syncer.getSummary();
    expect(first.items.map((i) => i.id).sort()).toEqual([a, b].sort());
    expect(first.source).toBe("server");
    expect(first.state.blockMaxCost).toBe(11_000_000_000);
    expect(syncer.stats.itemFetches).toBe(2);

    // Within the window: no new fetches at all.
    advance(REFRESH_MS - 1);
    await syncer.getSummary();
    expect(syncer.stats.idListFetches).toBe(1);

    // b confirmed, c arrived: exactly one item fetch, b dropped.
    setIds([a, c]);
    advance(REFRESH_MS);
    const second = await syncer.getSummary();
    expect(second.items.map((i) => i.id).sort()).toEqual([a, c].sort());
    expect(syncer.stats.itemFetches).toBe(3);
    expect(syncer.stats.idListFetches).toBe(2);
    expect(second.generatedAt).toBeGreaterThan(first.generatedAt);
  });

  test("keeps retrying ids whose fetch failed while they are still listed", async () => {
    const a = fullItems[0]!.name;
    const ghost = "ff".repeat(32);
    const { syncer, setIds, advance } = makeSyncer([a, ghost]);
    await syncer.getSummary();
    expect(syncer.pendingCount).toBe(1);
    advance(REFRESH_MS);
    await syncer.getSummary();
    expect(syncer.pendingCount).toBe(1);
    setIds([a]);
    advance(REFRESH_MS);
    await syncer.getSummary();
    expect(syncer.pendingCount).toBe(0);
  });

  test("concurrent callers share one refresh", async () => {
    const { syncer } = makeSyncer(fullItems.map((i) => i.name));
    await Promise.all([syncer.getSummary(), syncer.getSummary(), syncer.getSummary()]);
    expect(syncer.stats.idListFetches).toBe(1);
    expect(syncer.stats.itemFetches).toBe(fullItems.length);
  });

  test("payload stays compact", async () => {
    const { syncer } = makeSyncer(fullItems.map((i) => i.name));
    const summary = await syncer.getSummary();
    const bytes = JSON.stringify(summary).length;
    // Worst case: the fixture items carry hundreds of coins each (capped at 6 per list).
    // 100 such items stay under 200 KB; typical 2-4 coin items are well under 1 KB.
    expect(bytes / summary.items.length).toBeLessThan(1_800);
    console.log(`summary bytes per item: ${Math.round(bytes / summary.items.length)}`);
  });
});
