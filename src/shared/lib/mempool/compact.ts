import { feePerCost } from "@/shared/lib/chia/amounts";
import type { Coin, MempoolItem } from "@/shared/lib/rpc/types";
import { classifyMempoolItem } from "./classify";
import type { CompactCoin, CompactMempoolItem } from "./types";

/** Cap per-item coin lists so a giant bundle cannot blow up the summary payload. */
export const MAX_COINS_PER_ITEM = 16;

function compactCoin(coin: Coin): CompactCoin {
  return { ph: coin.puzzleHash, amount: coin.amount.toString(), parent: coin.parentCoinInfo };
}

/** Strip a full mempool item down to what the UI needs. `firstSeen` is supplied by the caller. */
export function compactMempoolItem(item: MempoolItem, firstSeen: number): CompactMempoolItem {
  const { kind, assetIds } = classifyMempoolItem(item);
  const value = item.removals.reduce((sum, c) => sum + c.amount, 0n);
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
    value: value.toString(),
    firstSeen,
    kind,
    assetIds,
  };
}
