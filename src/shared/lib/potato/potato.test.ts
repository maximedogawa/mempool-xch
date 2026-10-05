import { describe, expect, test } from "bun:test";
import type { CoinRecord } from "@/shared/lib/rpc/types";
import {
  advanceTip,
  formatCountdown,
  newerTip,
  POTATO,
  potatoChild,
  potatoState,
  type PotatoTip,
} from "./potato";

const record = (name: string, amount: bigint, height = 100, timestamp = 1_000): CoinRecord => ({
  coin: { parentCoinInfo: "aa", puzzleHash: "bb", amount },
  name,
  coinbase: false,
  confirmedBlockIndex: height,
  spent: false,
  spentBlockIndex: 0,
  timestamp,
});

describe("pot potato", () => {
  const tip: PotatoTip = {
    coinId: "tip",
    amount: (1952n * POTATO.price).toString(),
    height: 9_305_594,
    timestamp: 1_789_665_463,
    hops: 1952,
    ended: false,
  };

  test("the potato child is the one exactly one price above the parent", () => {
    const kids = [
      record("royalty", 1_952_000_000n),
      record("potato", 1953n * POTATO.price),
      record("change", 5n),
    ];
    expect(potatoChild(1952n * POTATO.price, kids)?.name).toBe("potato");
    expect(potatoChild(1952n * POTATO.price, [record("royalty", 1_952_000_000n)])).toBeNull();
    const next = advanceTip(tip, kids[1]!);
    expect(next).toMatchObject({
      coinId: "potato",
      hops: 1953,
      ended: false,
      height: 100,
      timestamp: 1_000,
    });
    expect(next.amount).toBe((1953n * POTATO.price).toString());
  });

  test("state: pot, snatches, countdown, progress, ripe and the next snatch cost", () => {
    const now = (tip.timestamp + 62_465) * 1000;
    const s = potatoState(tip, now);
    expect(s.pot).toBe(1952n * POTATO.price);
    expect(s.snatches).toBe(1952);
    expect(s.heldSeconds).toBe(62_465);
    expect(s.secondsLeft).toBe(23_935);
    expect(s.progress).toBeCloseTo(0.723, 3);
    expect(s.ripe).toBe(false);
    expect(s.nextSnatchCost).toBe(POTATO.price + 1952n * POTATO.royalty);
    expect(potatoState(tip, (tip.timestamp + 90_000) * 1000)).toMatchObject({
      secondsLeft: 0,
      ripe: true,
      progress: 1,
    });
    expect(potatoState({ ...tip, ended: true }, now).ripe).toBe(true);
  });

  test("countdown formatting and choosing the newer tip", () => {
    expect(formatCountdown(23_935)).toBe("06:38:55");
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(-5)).toBe("00:00:00");
    const newer = { ...tip, hops: 1953 };
    expect(newerTip(tip, newer)).toBe(newer);
    expect(newerTip(newer, tip)).toBe(newer);
    expect(newerTip(null, tip)).toBe(tip);
    expect(newerTip(undefined, null)).toBeNull();
  });
});
