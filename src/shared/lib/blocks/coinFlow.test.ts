import { describe, expect, test } from "bun:test";
import { coinName } from "@/shared/lib/chia/coin";
import type { CoinRecord } from "@/shared/lib/rpc/types";
import { buildCoinFlow } from "./coinFlow";

const ph = (n: number) => n.toString(16).padStart(64, "0");

function record(parent: string, puzzle: number, amount: bigint, coinbase = false): CoinRecord {
  const coin = { parentCoinInfo: parent, puzzleHash: ph(puzzle), amount };
  return { coin, name: coinName(coin), coinbase, confirmedBlockIndex: 10, spent: false, spentBlockIndex: 0, timestamp: 0 };
}

describe("coin flow", () => {
  test("links children to their exact parent and separates rewards", () => {
    const a = record(ph(0xa), 1, 1000n);
    const b = record(ph(0xb), 2, 50n);
    const a1 = record(a.name, 3, 400n);
    const a2 = record(a.name, 4, 590n);
    const b1 = record(b.name, 5, 50n);
    const reward = record(ph(0xc), 6, 875_000_000_000n, true);
    const flow = buildCoinFlow([b1, a1, reward, a2], [b, a]);
    expect(flow.groups.map((g) => g.parent.name)).toEqual([a.name, b.name]);
    expect(flow.groups[0]!.children.map((c) => c.name)).toEqual([a2.name, a1.name]);
    expect(flow.groups[1]!.children.map((c) => c.name)).toEqual([b1.name]);
    expect(flow.rewards.map((r) => r.name)).toEqual([reward.name]);
    expect(flow.unlinked).toEqual([]);
    expect(flow.ephemeral.size).toBe(0);
  });

  test("marks ephemeral coins, keeps childless spends and reports unlinked coins", () => {
    const a = record(ph(0xa), 1, 100n);
    const e = record(a.name, 2, 100n);
    const e1 = record(e.name, 3, 99n);
    const melted = record(ph(0xd), 4, 1n);
    const stray = record(ph(0xe), 5, 7n);
    const flow = buildCoinFlow([e, e1, stray], [a, e, melted]);
    expect(flow.ephemeral.has(e.name)).toBe(true);
    expect(flow.groups.find((g) => g.parent.name === melted.name)?.children).toEqual([]);
    expect(flow.groups.find((g) => g.parent.name === e.name)?.children.map((c) => c.name)).toEqual([e1.name]);
    expect(flow.unlinked.map((c) => c.name)).toEqual([stray.name]);
  });
});
