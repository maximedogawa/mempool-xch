import { describe, expect, test } from "bun:test";
import {
  formatChangePercent,
  formatUnits,
  formatUsd,
  formatUsdChange,
  formatUsdCompact,
} from "./format";

describe("portfolio formatting (English)", () => {
  test("USD keeps cents above a dollar and significant digits below", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(1234.5)).toBe("$1,234.50");
    expect(formatUsd(0.012345)).toBe("$0.01235");
    expect(formatUsd(0.00001)).toBe("<$0.0001");
  });

  test("changes carry their sign", () => {
    expect(formatUsdChange(12.3)).toBe("+$12.30");
    expect(formatUsdChange(-4)).toBe("−$4.00");
    expect(formatChangePercent(0.0123)).toBe("+1.23%");
    expect(formatChangePercent(-0.5)).toBe("−50.00%");
  });

  test("amounts and compact figures", () => {
    expect(formatUnits(1234.56789)).toBe("1,234.5679");
    expect(formatUnits(0.000123456)).toBe("0.0001235");
    expect(formatUsdCompact(950)).toBe("$950.00");
    expect(formatUsdCompact(1_234_567)).toBe("$1.2m");
  });
});
