import { describe, expect, test } from "bun:test";
import {
  ageBucketMinutes,
  assetLines,
  formatShare,
  formatXchUnits,
  parseRateInput,
  sizeBucketBounds,
} from "./format";

describe("formatXchUnits", () => {
  test("never prints raw mojos", () => {
    expect(formatXchUnits(0n)).toBe("0 XCH");
    expect(formatXchUnits(1n)).toBe("0.000000000001 XCH");
    expect(formatXchUnits(123_456n)).toBe("0.000000123456 XCH");
    expect(formatXchUnits(5_000_000n)).toBe("0.000005 XCH");
    expect(formatXchUnits(1_500_000_000_000n)).toBe("1.5 XCH");
    [1n, 999n, 999_999n, 1_000_000n].forEach((m) => expect(formatXchUnits(m)).not.toMatch(/mojo/));
  });
});

describe("assetLines", () => {
  const tickers = (id: string) => (id === "aa" ? "SBX" : undefined);
  test("CATs first (largest first), then NFTs and XCH", () => {
    expect(
      assetLines(
        {
          xch: "1000000000000",
          cats: [
            { assetId: "bb", amount: "10" },
            { assetId: "aa", amount: "12345" },
          ],
          nfts: 2,
          dids: 0,
          singletons: 0,
        },
        "offer",
        tickers
      )
    ).toEqual(["12.345 SBX", "0.01 CAT", "2 NFTs", "1 XCH"]);
  });
  test("an empty bundle shows zero XCH; pool claims are named", () => {
    expect(assetLines(undefined, "xch", tickers)).toEqual(["0 XCH"]);
    expect(
      assetLines({ xch: "0", cats: [], nfts: 0, dids: 0, singletons: 1 }, "pool", tickers)
    ).toEqual(["1 pool claim"]);
  });
});

describe("small helpers", () => {
  test("shares", () => {
    expect(formatShare(0)).toBe("0%");
    expect(formatShare(0.0001)).toBe("<0.1%");
    expect(formatShare(0.0512)).toBe("5.1%");
    expect(formatShare(0.5)).toBe("50%");
  });
  test("bucket bounds", () => {
    expect(sizeBucketBounds("tiny")).toEqual({ min: "0", max: "10.0M" });
    expect(sizeBucketBounds("huge")).toEqual({ min: "1.00B", max: null });
    expect(ageBucketMinutes("min10")).toEqual({ min: 1, max: 10 });
    expect(ageBucketMinutes("older")).toEqual({ min: 60, max: null });
  });
  test("rate input", () => {
    expect(parseRateInput("")).toBeNull();
    expect(parseRateInput(" 5 ")).toBe(5);
    expect(parseRateInput("0,5")).toBe(0.5);
    expect(parseRateInput("-1")).toBeNull();
    expect(parseRateInput("abc")).toBeNull();
  });
});
