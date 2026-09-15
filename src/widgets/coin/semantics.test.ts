import { describe, expect, test } from "bun:test";
import { kindFromSemantics, readSemantics } from "./semantics";

describe("coin semantics", () => {
  test("maps outer puzzle types to kinds", () => {
    expect(kindFromSemantics("CAT")).toBe("cat");
    expect(kindFromSemantics("NFT")).toBe("nft");
    expect(kindFromSemantics("DID")).toBe("did");
    expect(kindFromSemantics("Singleton")).toBe("singleton");
    expect(kindFromSemantics("XCH")).toBe("xch");
    expect(kindFromSemantics(null)).toBe("unknown");
  });
  test("reads known keys defensively and collects the rest", () => {
    expect(readSemantics(null)).toBeNull();
    const s = readSemantics({
      coin_id: "aa",
      outer_puzzle_type: "CAT",
      custody_puzzle_type: "P2DelegatedPuzzleOrHidden",
      custody_p2: "0xbb",
      asset_id: "0xcc",
      classification: "verified",
      extra_flag: true,
      nested: { ignored: 1 },
    })!;
    expect(s.kind).toBe("cat");
    expect(s.custodyP2).toBe("bb");
    expect(s.assetId).toBe("cc");
    expect(s.classification).toBe("verified");
    expect(s.rest).toEqual([["extra_flag", "true"]]);
    expect(readSemantics({ type: "NFT", launcher_id: "0xdd" })!.assetId).toBe("dd");
  });
});
