import { describe, expect, test } from "bun:test";
import blockTransactions from "@/test-utils/fixtures/block_transactions.json";
import { launcherIdToDidId, puzzleHashToAddress } from "@/shared/lib/chia/address";
import { normaliseTxSummary } from "@/shared/lib/rpc/normalise";
import { deriveAddressFlow } from "./deriveFlow";
import { resolveAddressId } from "./resolveAddressId";

const tx = normaliseTxSummary(blockTransactions.transactions[0]);
const sender = "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4";
const receiver = "136581883c12925131322e2c7afdae574fa4ce87a35a9cdc0636803d06e9d1c3";

describe("deriveAddressFlow", () => {
  test("sender sees an outgoing net change and the receiver as counterparty", () => {
    const flow = deriveAddressFlow(tx, `0x${sender}`);
    expect(flow.direction).toBe("out");
    expect(flow.xch).toBe(666650637171427n - 666765392292131n);
    expect(flow.counterparties).toEqual([receiver]);
    expect(flow.cats).toEqual([]);
  });
  test("receiver sees an incoming change", () => {
    const flow = deriveAddressFlow(tx, receiver);
    expect(flow.direction).toBe("in");
    expect(flow.xch).toBe(114150535534n);
  });
  test("unrelated p2 has no flow", () => {
    expect(deriveAddressFlow(tx, "ab".repeat(32)).direction).toBe("none");
  });
  test("cat and nft changes are aggregated", () => {
    const summary = {
      ...tx,
      events: [
        {
          ...tx.events[0]!,
          participants: [
            {
              p2: sender,
              sent: { xch: 0n, cats: [{ assetId: "aa", amount: 5n }], nfts: ["n1"] },
              received: {
                xch: 0n,
                cats: [
                  { assetId: "aa", amount: 2n },
                  { assetId: "bb", amount: 7n },
                ],
                nfts: ["n2"],
              },
            },
          ],
        },
      ],
    };
    const flow = deriveAddressFlow(summary, sender);
    expect(flow.direction).toBe("self");
    expect(flow.cats).toEqual([
      { assetId: "aa", amount: -3n },
      { assetId: "bb", amount: 7n },
    ]);
    expect(flow.nftsIn).toEqual(["n2"]);
    expect(flow.nftsOut).toEqual(["n1"]);
  });
});

describe("resolveAddressId", () => {
  test("address, puzzle hash and did", () => {
    const xch = puzzleHashToAddress(sender, "xch");
    expect(resolveAddressId(xch, "xch")).toEqual({
      kind: "address",
      puzzleHash: sender,
      address: xch,
      didId: null,
    });
    expect(resolveAddressId(puzzleHashToAddress(sender, "txch"), "xch")?.address).toBe(xch);
    expect(resolveAddressId(`0x${sender.toUpperCase()}`, "txch")?.address).toBe(
      puzzleHashToAddress(sender, "txch")
    );
    const did = launcherIdToDidId(sender);
    expect(resolveAddressId(did, "xch")).toEqual({
      kind: "did",
      puzzleHash: sender,
      address: null,
      didId: did,
    });
    expect(resolveAddressId("nonsense", "xch")).toBeNull();
    expect(resolveAddressId("", "xch")).toBeNull();
  });
});
