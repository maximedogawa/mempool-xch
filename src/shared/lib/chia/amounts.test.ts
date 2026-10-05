import { describe, expect, test } from "bun:test";
import { xchPlain } from "./amounts";

describe("xchPlain", () => {
  test("zero and whole XCH have no fraction", () => {
    expect(xchPlain(0n)).toBe("0");
    expect(xchPlain(1_000_000_000_000n)).toBe("1");
    expect(xchPlain(21_000_000_000_000_000_000n)).toBe("21000000");
  });

  test("fractions keep full mojo precision without trailing zeros", () => {
    expect(xchPlain(1_756_000n)).toBe("0.000001756");
    expect(xchPlain(1n)).toBe("0.000000000001");
    expect(xchPlain(1_500_000_000_000n)).toBe("1.5");
    expect(xchPlain(1_234_567_890_123_456n)).toBe("1234.567890123456");
  });

  test("never groups digits or uses a locale separator", () => {
    expect(xchPlain(12_345_678_900_000_000n)).toBe("12345.6789");
    expect(xchPlain(12_345_678_900_000_000n)).not.toMatch(/[, ]/);
  });

  test("negative amounts keep their sign", () => {
    expect(xchPlain(-2_500_000_000n)).toBe("-0.0025");
  });
});
