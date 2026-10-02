import { describe, expect, test } from "bun:test";
import {
  divRound,
  formatPpmPercent,
  formatPrice,
  formatScaled,
  parseScaled,
  ratioPpm,
} from "./decimal";

describe("market fixed-point decimals", () => {
  test("parses strings and JSON numbers without float drift", () => {
    expect(parseScaled("1.631")).toBe(163_100_000n);
    expect(parseScaled(1.6345)).toBe(163_450_000n);
    expect(parseScaled(0.1 + 0.2)).toBe(30_000_000n); // 0.30000000000000004 rounds away
    expect(parseScaled("0.000000015")).toBe(2n); // half up at the 9th digit
    expect(parseScaled(1e-7)).toBe(10n);
    expect(parseScaled("42.050010738782", 12)).toBe(42_050_010_738_782n);
  });

  test("rejects negatives, garbage and non-finite values", () => {
    for (const bad of ["-1", "abc", "", "1,5", null, undefined, Number.NaN, Infinity, -2, {}])
      expect(parseScaled(bad)).toBeNull();
  });

  test("rounds divisions half away from zero", () => {
    expect(divRound(5n, 2n)).toBe(3n);
    expect(divRound(-5n, 2n)).toBe(-3n);
    expect(divRound(4n, 3n)).toBe(1n);
  });

  test("formats prices and percents at the edge", () => {
    expect(formatPrice(163_100_000n)).toBe("1.6310");
    expect(formatPrice(1_250_000_000n)).toBe("12.50");
    expect(formatScaled(-400_000n, 4, 8, true)).toBe("−0.0040");
    expect(formatScaled(400_000n, 4, 8, true)).toBe("+0.0040");
    expect(formatScaled(null, 2)).toBe("—");
    expect(ratioPpm(100_000n, 163_050_000n)).toBe(613n);
    expect(formatPpmPercent(613n)).toBe("0.06%");
    expect(formatPpmPercent(ratioPpm(0n, 0n))).toBe("—");
  });
});
