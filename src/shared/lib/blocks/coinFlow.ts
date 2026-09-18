import type { CoinRecord } from "@/shared/lib/rpc/types";

export interface CoinFlowGroup {
  /** The coin spent in this block. */
  parent: CoinRecord;
  /** Coins created by that spend, largest first. */
  children: CoinRecord[];
}

export interface CoinFlow {
  /** Spent coins with what they created, most children first, then by amount. */
  groups: CoinFlowGroup[];
  /** Farmer and pool reward coins (coinbase), which have no spent parent. */
  rewards: CoinRecord[];
  /** Created coins whose parent is not among this block's removals (should not happen on a valid block). */
  unlinked: CoinRecord[];
  /** Coin ids created and spent within the same block. */
  ephemeral: ReadonlySet<string>;
}

const byAmountDesc = (a: CoinRecord, b: CoinRecord) =>
  a.coin.amount === b.coin.amount ? 0 : a.coin.amount > b.coin.amount ? -1 : 1;

/**
 * Link every created coin to the coin whose spend created it: a child's parent_coin_info is the
 * parent's coin id exactly. Spent coins that created nothing (e.g. melted or fully paid as fee)
 * still get a group with no children.
 */
export function buildCoinFlow(additions: CoinRecord[], removals: CoinRecord[]): CoinFlow {
  const removalIds = new Set(removals.map((r) => r.name));
  const additionIds = new Set(additions.map((a) => a.name));
  const children = new Map<string, CoinRecord[]>();
  const rewards: CoinRecord[] = [];
  const unlinked: CoinRecord[] = [];
  for (const addition of additions) {
    if (addition.coinbase) {
      rewards.push(addition);
      continue;
    }
    const parentId = addition.coin.parentCoinInfo;
    if (!removalIds.has(parentId)) {
      unlinked.push(addition);
      continue;
    }
    const list = children.get(parentId);
    if (list) list.push(addition);
    else children.set(parentId, [addition]);
  }
  const groups = removals
    .map((parent) => ({ parent, children: (children.get(parent.name) ?? []).sort(byAmountDesc) }))
    .sort((a, b) => b.children.length - a.children.length || byAmountDesc(a.parent, b.parent));
  const ephemeral = new Set([...removalIds].filter((id) => additionIds.has(id)));
  return { groups, rewards: rewards.sort(byAmountDesc), unlinked, ephemeral };
}
