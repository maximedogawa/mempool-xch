/**
 * What moved in a block, per asset (TASK-030).
 *
 * With Coinset summaries: for every event, each participant's positive net inflow per asset
 * (received − sent, floored at 0) is summed. That is the amount that actually changed hands:
 * change returned to the sender does not count, fees do not count. NFTs and DIDs are counted
 * once per transfer. Without Coinset the fallback classifies the block's coin spends and sums
 * the spent amounts per kind, which is a gross figure (includes change); `source` says which.
 */
import { classifyCoinSpend } from "@/shared/lib/mempool/classify";
import type { CompactAssets } from "@/shared/lib/mempool/types";
import type { CoinSpend, TxSummary } from "@/shared/lib/rpc/types";

export interface BlockAssetTotals extends CompactAssets {
  source: "coinset" | "rpc";
  /** Number of transactions (Coinset) or coin spends (rpc) the totals cover. */
  count: number;
  /** True when not every transaction of the block was fetched. */
  partial: boolean;
}

export const EMPTY_TOTALS: BlockAssetTotals = { xch: "0", cats: [], nfts: 0, dids: 0, singletons: 0, source: "coinset", count: 0, partial: false };

export function assetTotalsFromSummaries(txs: TxSummary[], partial = false): BlockAssetTotals {
  let xch = 0n;
  const cats = new Map<string, bigint>();
  const nfts = new Set<string>();
  txs.forEach((tx) =>
    tx.events.forEach((e) => {
      e.participants.forEach((p) => {
        const net = p.received.xch - p.sent.xch;
        if (net > 0n) xch += net;
        const sentCats = new Map(p.sent.cats.map((c) => [c.assetId, c.amount]));
        p.received.cats.forEach((c) => {
          const n = c.amount - (sentCats.get(c.assetId) ?? 0n);
          if (n > 0n) cats.set(c.assetId, (cats.get(c.assetId) ?? 0n) + n);
        });
        p.received.nfts.forEach((id) => nfts.add(id));
      });
      // Mints have no receiving participant flow for the new asset in every schema version.
      const minted = (e.raw as { minted?: { asset_type?: string; asset_id?: string } }).minted;
      if (minted?.asset_type === "nft" && minted.asset_id) nfts.add(minted.asset_id.replace(/^0x/, ""));
    })
  );
  return {
    xch: xch.toString(),
    cats: [...cats.entries()].map(([assetId, amount]) => ({ assetId, amount: amount.toString() })),
    nfts: nfts.size,
    dids: 0,
    singletons: 0,
    source: "coinset",
    count: txs.length,
    partial,
  };
}

export function assetTotalsFromSpends(spends: CoinSpend[]): BlockAssetTotals {
  let xch = 0n;
  const cats = new Map<string, bigint>();
  let nfts = 0;
  let dids = 0;
  let singletons = 0;
  spends.forEach((spend) => {
    const c = classifyCoinSpend(spend);
    if (c.kind === "cat") cats.set(c.assetId ?? "unknown", (cats.get(c.assetId ?? "unknown") ?? 0n) + spend.coin.amount);
    else if (c.kind === "nft") nfts += 1;
    else if (c.kind === "did") dids += 1;
    else if (c.kind === "singleton" || c.kind === "pool") singletons += 1;
    else xch += spend.coin.amount;
  });
  return {
    xch: xch.toString(),
    cats: [...cats.entries()].map(([assetId, amount]) => ({ assetId, amount: amount.toString() })),
    nfts,
    dids,
    singletons,
    source: "rpc",
    count: spends.length,
    partial: false,
  };
}
