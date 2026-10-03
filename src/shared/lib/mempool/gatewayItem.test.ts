import { describe, expect, test } from "bun:test";
import sample from "@/test-utils/fixtures/kind_sample.json";
import { parseJsonSafe } from "@/shared/lib/rpc/json";
import { normaliseMempoolItem } from "@/shared/lib/rpc/normalise";
import { compactMempoolItem } from "./compact";
import { compactAllFromGateway, compactFromGateway } from "./gatewayItem";

const ID = "ab".repeat(32);
const ENTRY = {
  id: `0x${ID}`,
  first_seen_ms: 1_790_480_012_000,
  fee_mojos: 50_000_000,
  cost: 12_000_000,
  spends: 2,
  additions: [{ parent_coin_info: "0x01", puzzle_hash: "0x02", amount: 1000 }],
  removals: [{ parent_coin_info: "0x03", puzzle_hash: "0x02", amount: 1000 }],
  addition_count: 3,
  removal_count: 2,
  kind: "cat",
  asset_ids: ["0xCD"],
  assets: {
    xch: "50000000",
    cats: [
      { asset_id: "0xcd", amount: "1000" },
      { asset_id: null, amount: "5" },
    ],
    nfts: 0,
    dids: 0,
    singletons: 0,
  },
};

describe("compactFromGateway", () => {
  test("a gateway entry becomes the compact item the widgets read", () => {
    expect(compactFromGateway(ENTRY)).toEqual({
      id: ID,
      fee: "50000000",
      cost: 12_000_000,
      feeRate: 50_000_000 / 12_000_000,
      spends: 2,
      additions: [{ ph: "02", amount: "1000", parent: "01" }],
      removals: [{ ph: "02", amount: "1000", parent: "03" }],
      additionCount: 3,
      removalCount: 2,
      assets: {
        xch: "50000000",
        cats: [
          { assetId: "cd", amount: "1000" },
          { assetId: "unknown", amount: "5" },
        ],
        nfts: 0,
        dids: 0,
        singletons: 0,
      },
      firstSeen: 1_790_480_012_000,
      kind: "cat",
      assetIds: ["cd"],
    });
  });

  test("amounts beyond 2^53 keep every digit through the safe parser", () => {
    const text = JSON.stringify(ENTRY).replace(
      '"amount":1000}]',
      '"amount":18446744073709551615}]'
    );
    const item = compactFromGateway(parseJsonSafe(text));
    expect(item?.additions[0]?.amount).toBe("18446744073709551615");
  });

  test("an entry without details is not an item, and one of them spoils a list", () => {
    const bare = { id: `0x${ID}`, first_seen_ms: 1, fee_mojos: 0, cost: 0 };
    expect(compactFromGateway(bare)).toBeNull();
    expect(compactFromGateway(null)).toBeNull();
    expect(compactAllFromGateway([ENTRY, bare])).toBeNull();
    expect(compactAllFromGateway([ENTRY])?.length).toBe(1);
    expect(compactAllFromGateway(undefined)).toEqual([]);
  });

  /**
   * The gateway derives its entries with this app's rules; nodexch tests its side against
   * `mempool_kind_sample_details.json`, generated from these same 50 transactions. Here the
   * round trip: this app's compact item, written as the gateway writes it, reads back equal.
   */
  test("the wire shape round-trips this app's own compact items", () => {
    const rows = (sample as { rows: { item: unknown }[] }).rows;
    const hex = (v: string) => `0x${v}`;
    for (const row of rows) {
      const ours = compactMempoolItem(normaliseMempoolItem(row.item), 1234);
      const coin = (c: { ph: string; amount: string; parent: string }) => ({
        parent_coin_info: hex(c.parent),
        puzzle_hash: hex(c.ph),
        amount: BigInt(c.amount),
      });
      const wire = {
        id: hex(ours.id),
        first_seen_ms: ours.firstSeen,
        fee_mojos: BigInt(ours.fee),
        cost: ours.cost,
        spends: ours.spends,
        additions: ours.additions.map(coin),
        removals: ours.removals.map(coin),
        addition_count: ours.additionCount,
        removal_count: ours.removalCount,
        kind: ours.kind,
        asset_ids: ours.assetIds.map(hex),
        assets: {
          ...ours.assets,
          cats: ours.assets.cats.map((c) => ({
            asset_id: c.assetId === "unknown" ? null : hex(c.assetId),
            amount: c.amount,
          })),
        },
      };
      expect(compactFromGateway(wire)).toEqual(ours);
    }
  });
});
