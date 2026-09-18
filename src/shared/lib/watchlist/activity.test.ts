import { describe, expect, test } from "bun:test";
import type { TxSummary } from "@/shared/lib/rpc/types";
import { receivesForP2 } from "./activity";

const P2_A = "a".repeat(64);
const P2_B = "b".repeat(64);

function tx(
  participants: { p2: string; receivedXch?: bigint; receivedCat?: bigint; receivedNft?: string[] }[]
): TxSummary {
  return {
    id: "id",
    source: "inferred",
    status: "confirmed",
    cost: 0,
    feeMojos: 0n,
    firstSeenMs: null,
    confirmedHeight: 1,
    confirmedHeaderHash: null,
    confirmedAtMs: 1,
    removedAtMs: null,
    lastUpdatedMs: 1,
    kind: "transfer",
    events: [
      {
        type: "transfer",
        feeMojos: 0n,
        inputs: [],
        outputs: [],
        memos: [],
        raw: {},
        participants: participants.map((p) => ({
          p2: p.p2,
          sent: { xch: 0n, cats: [], nfts: [] },
          received: {
            xch: p.receivedXch ?? 0n,
            cats: p.receivedCat ? [{ assetId: "x", amount: p.receivedCat }] : [],
            nfts: p.receivedNft ?? [],
          },
        })),
      },
    ],
  };
}

describe("receivesForP2", () => {
  test("true when the puzzle hash received XCH", () => {
    expect(receivesForP2(tx([{ p2: P2_A, receivedXch: 100n }]), P2_A)).toBe(true);
  });

  test("true when the puzzle hash received a CAT or an NFT", () => {
    expect(receivesForP2(tx([{ p2: P2_A, receivedCat: 5n }]), P2_A)).toBe(true);
    expect(receivesForP2(tx([{ p2: P2_A, receivedNft: ["nft1"] }]), P2_A)).toBe(true);
  });

  test("false for a different participant or a sender who received nothing", () => {
    expect(receivesForP2(tx([{ p2: P2_B, receivedXch: 100n }]), P2_A)).toBe(false);
    expect(receivesForP2(tx([{ p2: P2_A, receivedXch: 0n }]), P2_A)).toBe(false);
  });

  test("matches case-insensitively and with a 0x prefix", () => {
    expect(receivesForP2(tx([{ p2: P2_A, receivedXch: 1n }]), `0x${P2_A.toUpperCase()}`)).toBe(
      true
    );
  });
});
