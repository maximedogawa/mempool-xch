import { describe, expect, test } from "bun:test";
import { deriveAssets, mergePages, type WalletCoinRef, type WalletTx } from "./wallet";

const ref = (over: Partial<WalletCoinRef>): WalletCoinRef => ({ coinId: "c", amount: 1n, address: "xch1a", assetKind: "xch", assetId: null, assetName: null, ticker: null, precision: 12, ...over });
const tx = (spent: WalletCoinRef[], created: WalletCoinRef[]): WalletTx => ({ id: null, height: 1, timestamp: 1, fee: null, spent, created, pending: false });

describe("wallet history helpers", () => {
  test("deriveAssets lists XCH first and distinct CATs/NFTs by activity", () => {
    const cat = "ab".repeat(32);
    const nft = "cd".repeat(32);
    const txs = [
      tx([ref({})], [ref({})]),
      tx([ref({ assetKind: "cat", assetId: cat, assetName: "Spacebucks", ticker: "SBX", precision: 3 })], [ref({ assetKind: "cat", assetId: cat })]),
      tx([ref({ assetKind: "cat", assetId: cat })], []),
      tx([], [ref({ assetKind: "nft", assetId: nft, assetName: "Pic #1" })]),
    ];
    const assets = deriveAssets(txs);
    expect(assets.map((a) => a.kind)).toEqual(["xch", "cat", "nft"]);
    expect(assets[1]).toMatchObject({ assetId: cat, name: "Spacebucks", ticker: "SBX", precision: 3, txCount: 2 });
    expect(assets[2]).toMatchObject({ assetId: nft, name: "Pic #1", txCount: 1 });
    expect(assets[0]!.txCount).toBe(1);
  });
  test("mergePages orders by offset", () => {
    const merged = mergePages([
      { offset: 25, items: ["c"] },
      { offset: 0, items: ["a", "b"] },
    ]);
    expect(merged).toEqual(["a", "b", "c"]);
  });
});
