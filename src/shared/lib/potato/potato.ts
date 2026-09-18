/**
 * Pot Potato (github.com/cameroncooper/pot-potato, potpotato.xyz): a hot-potato game that
 * lives entirely on chain. A genesis coin starts a round; every snatch spends the current
 * potato coin into a child whose amount is the parent's plus PRICE, so the pot is the tip
 * coin's amount and the snatch count is the number of hops. Whoever holds the tip for
 * HOLD_SECONDS keeps the pot: no transaction, the clawback simply becomes their XCH. Pure
 * functions here; the walker lives in the snapshot script and the browser hook.
 */
import type { CoinRecord } from "@/shared/lib/rpc/types";

export const POTATO = {
  /** Mainnet round the site follows (the same one xchmempool.com and potpotato.xyz show). */
  genesis: "49ca6dcfd0d186895e1f35d5cbe7e1eea33b454daa990cf518f64a1e8cf79342",
  price: 1_000_000_000_000n,
  royalty: 1_000_000_000n,
  holdSeconds: 86_400,
  /** The snatch timestamp in the solution must be within this of chain time; our clock is the block's. */
  timelockBufferSeconds: 120,
  site: "https://potpotato.xyz",
} as const;

export interface PotatoTip {
  coinId: string;
  /** Pot in mojos (the coin amount). */
  amount: string;
  height: number;
  /** Block timestamp of the tip coin (unix seconds): when the current holder took it. */
  timestamp: number;
  /** Snatches so far (hops from genesis). */
  hops: number;
  /** True once the tip was spent by something other than a snatch (claim or push-through). */
  ended: boolean;
}

/** The potato child among a spent coin's children: exactly PRICE more than the parent. */
export function potatoChild(parentAmount: bigint, children: CoinRecord[]): CoinRecord | null {
  return children.find((c) => c.coin.amount === parentAmount + POTATO.price) ?? null;
}

export function advanceTip(tip: PotatoTip, child: CoinRecord): PotatoTip {
  return {
    coinId: child.name,
    amount: child.coin.amount.toString(),
    height: child.confirmedBlockIndex,
    timestamp: child.timestamp,
    hops: tip.hops + 1,
    ended: false,
  };
}

export interface PotatoState {
  pot: bigint;
  snatches: number;
  heldSeconds: number;
  secondsLeft: number;
  /** 0..1 share of the hold already served. */
  progress: number;
  ripe: boolean;
  /** PRICE plus one royalty per previous holder (the bag the next snatcher pays). */
  nextSnatchCost: bigint;
  deadlineMs: number;
}

export function potatoState(tip: PotatoTip, nowMs = Date.now()): PotatoState {
  const held = Math.max(0, Math.floor(nowMs / 1000) - tip.timestamp);
  const left = Math.max(0, POTATO.holdSeconds - held);
  return {
    pot: BigInt(tip.amount),
    snatches: tip.hops,
    heldSeconds: held,
    secondsLeft: left,
    progress: Math.min(1, held / POTATO.holdSeconds),
    ripe: left === 0 || tip.ended,
    nextSnatchCost: POTATO.price + POTATO.royalty * BigInt(tip.hops),
    deadlineMs: (tip.timestamp + POTATO.holdSeconds) * 1000,
  };
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  return `${h}:${m}:${String(s % 60).padStart(2, "0")}`;
}

/** The newer of two tips (more hops wins); either may be missing. */
export function newerTip(
  a: PotatoTip | null | undefined,
  b: PotatoTip | null | undefined
): PotatoTip | null {
  if (!a) return b ?? null;
  if (!b) return a;
  return b.hops > a.hops ? b : a;
}
