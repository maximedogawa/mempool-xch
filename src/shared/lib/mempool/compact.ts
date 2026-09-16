import { feePerCost } from "@/shared/lib/chia/amounts";
import type { Coin, MempoolItem } from "@/shared/lib/rpc/types";
import { classifyCoinSpend, classifyMempoolItem } from "./classify";
import type { CompactAssets, CompactCoin, CompactMempoolItem } from "./types";

/** Cap per-item coin lists so a giant bundle cannot blow up the summary payload. */
export const MAX_COINS_PER_ITEM = 6;

function compactCoin(coin: Coin): CompactCoin {
  return { ph: coin.puzzleHash, amount: coin.amount.toString(), parent: coin.parentCoinInfo };
}

/** Per-asset totals of the coins a bundle spends, classified spend by spend. */
export function bundleAssets(item: MempoolItem): CompactAssets {
  const cats = new Map<string, bigint>();
  let xch = 0n;
  let nfts = 0;
  let dids = 0;
  let singletons = 0;
  item.spendBundle.coinSpends.forEach((spend) => {
    const c = classifyCoinSpend(spend);
    if (c.kind === "cat") {
      const key = c.assetId ?? "unknown";
      cats.set(key, (cats.get(key) ?? 0n) + spend.coin.amount);
    } else if (c.kind === "nft") nfts += 1;
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
  };
}

/** Strip a full mempool item down to what the UI needs. `firstSeen` is supplied by the caller. */
export function compactMempoolItem(item: MempoolItem, firstSeen: number): CompactMempoolItem {
  const { kind, assetIds } = classifyMempoolItem(item);
  return {
    id: item.name,
    fee: item.fee.toString(),
    cost: item.cost,
    feeRate: feePerCost(item.fee, item.cost),
    spends: item.spendBundle.coinSpends.length,
    additions: item.additions.slice(0, MAX_COINS_PER_ITEM).map(compactCoin),
    removals: item.removals.slice(0, MAX_COINS_PER_ITEM).map(compactCoin),
    additionCount: item.additions.length,
    removalCount: item.removals.length,
    assets: bundleAssets(item),
    firstSeen,
    kind,
    assetIds,
  };
}
