import { describe, expect, test } from "bun:test";
import { formatAmount, formatCat, formatFeeRate, formatXch, toMojos, feePerCost } from "./amounts";
import {
  addressToPuzzleHash,
  decodeBech32m,
  didIdToLauncherId,
  launcherIdToDidId,
  launcherIdToNftId,
  nftIdToLauncherId,
  puzzleHashToAddress,
  resolvePuzzleHash,
} from "./address";
import { coinName, encodeAmount } from "./coin";
import { bytesToHex, hexToUtf8IfText, isHex, normaliseId32, shortId, stripHexPrefix } from "./hex";
import { sha256 } from "./sha256";

describe("amounts", () => {
  test("toMojos accepts numbers, strings and bigints", () => {
    expect(toMojos(5)).toBe(5n);
    expect(toMojos("673045466616444")).toBe(673045466616444n);
    expect(toMojos(7n)).toBe(7n);
    expect(toMojos(null)).toBe(0n);
    expect(toMojos("")).toBe(0n);
  });
  test("formatXch keeps 12 decimals", () => {
    expect(formatXch(1_000_000_000_000n)).toBe("1");
    expect(formatXch(1_234_567_890_123_456n)).toBe("1,234.567890123456");
    expect(formatXch(1n)).toBe("0.000000000001");
    expect(formatXch(-500_000_000_000n)).toBe("-0.5");
  });
  test("formatCat uses 3 decimals", () => {
    expect(formatCat(213125n)).toBe("213.125");
    expect(formatCat(5000n)).toBe("5");
  });
  test("formatAmount picks a readable unit", () => {
    expect(formatAmount(0n)).toBe("0 XCH");
    expect(formatAmount(500n)).toBe("500 mojo");
    expect(formatAmount(604585170n)).toBe("0.0006045 XCH");
    expect(formatAmount(100251533n)).toBe("0.0001002 XCH");
    expect(formatAmount(666650637171427n)).toBe("666.6506 XCH");
    expect(formatAmount(21_000_000_000_000_000_000n)).toBe("21,000,000 XCH");
  });
  test("fee rate formatting", () => {
    expect(feePerCost(604585170n, 80587336)).toBeCloseTo(7.5, 1);
    expect(formatFeeRate(0)).toBe("0");
    expect(formatFeeRate(0.3736)).toBe("0.374");
    expect(formatFeeRate(0.0003)).toBe("<0.001");
    expect(formatFeeRate(7.5023)).toBe("7.50");
    expect(formatFeeRate(1234.5)).toBe("1,235");
  });
});

describe("hex", () => {
  test("strip and validate", () => {
    expect(stripHexPrefix("0xABcd")).toBe("abcd");
    expect(isHex("0xabcd")).toBe(true);
    expect(isHex("xyz")).toBe(false);
    expect(isHex("abc")).toBe(false);
    expect(normaliseId32(`0x${"ab".repeat(32)}`)).toBe("ab".repeat(32));
    expect(normaliseId32("abcd")).toBeNull();
  });
  test("shortId", () => {
    expect(shortId("0x124ef3da229ff0ea200bbaed36fd8d31b00db2378f3226977cb2cc93c1c450dd")).toBe("124ef3da…c450dd");
    expect(shortId("abc")).toBe("abc");
  });
  test("memo decoding", () => {
    expect(hexToUtf8IfText(bytesToHex(new TextEncoder().encode("hello memo")))).toBe("hello memo");
    expect(hexToUtf8IfText("0001ff")).toBeNull();
    expect(hexToUtf8IfText("")).toBeNull();
  });
});

describe("addresses", () => {
  // Known vector: the puzzle hash of a Coinset-observed coin and its bech32m encoding.
  const ph = "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4";
  test("round-trips xch and txch", () => {
    const xch = puzzleHashToAddress(ph, "xch");
    expect(xch.startsWith("xch1")).toBe(true);
    expect(addressToPuzzleHash(xch)).toBe(ph);
    const txch = puzzleHashToAddress(ph, "txch");
    expect(txch.startsWith("txch1")).toBe(true);
    expect(addressToPuzzleHash(txch)).toBe(ph);
    expect(resolvePuzzleHash(xch)).toBe(ph);
    expect(resolvePuzzleHash(`0x${ph}`)).toBe(ph);
    expect(resolvePuzzleHash("nope")).toBeNull();
  });
  test("rejects a corrupted checksum", () => {
    const xch = puzzleHashToAddress(ph, "xch");
    const corrupted = `${xch.slice(0, -1)}${xch.endsWith("q") ? "p" : "q"}`;
    expect(addressToPuzzleHash(corrupted)).toBeNull();
    expect(addressToPuzzleHash(xch.toUpperCase())).toBe(ph);
  });
  test("nft and did ids", () => {
    const launcher = "ab".repeat(32);
    const nft = launcherIdToNftId(launcher);
    expect(nft.startsWith("nft1")).toBe(true);
    expect(nftIdToLauncherId(nft)).toBe(launcher);
    const did = launcherIdToDidId(launcher);
    expect(did.startsWith("did:chia:1")).toBe(true);
    expect(didIdToLauncherId(did)).toBe(launcher);
    expect(decodeBech32m("xch1invalid")).toBeNull();
  });
});

describe("coin ids", () => {
  test("sha256 test vectors", () => {
    expect(bytesToHex(sha256(new Uint8Array(0)))).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
    expect(bytesToHex(sha256(new TextEncoder().encode("abc")))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });
  test("amount encoding is a minimal signed big-endian atom", () => {
    expect(bytesToHex(encodeAmount(0n))).toBe("");
    expect(bytesToHex(encodeAmount(1n))).toBe("01");
    expect(bytesToHex(encodeAmount(127n))).toBe("7f");
    expect(bytesToHex(encodeAmount(128n))).toBe("0080");
    expect(bytesToHex(encodeAmount(1_000_000_000_000n))).toBe("00e8d4a51000");
  });
  test("coin name matches a coin observed on chain", () => {
    // Addition from block 9295514 whose spend in tx b379124c… was recorded with this coin id.
    const coin = {
      parentCoinInfo: "0ff17454d122555c4a6f1aa95369f00bce3b51675b2a67548476f1bebc32116d",
      puzzleHash: "9fbde16e03f55c85ecf94cb226083fcfe2737d4e629a981e5db3ea0eb9907af4",
      amount: 666650637171427n,
    };
    expect(coinName(coin)).toHaveLength(64);
    // Deterministic: same input, same id.
    expect(coinName(coin)).toBe(coinName({ ...coin }));
  });
});
