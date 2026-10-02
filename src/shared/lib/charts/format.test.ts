import { describe, expect, test } from "bun:test";
import { formatBytes } from "./format";

describe("formatBytes", () => {
  test("zero and negative", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-5)).toBe("0 B");
  });
  test("scales through the units", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1024)).toBe("1.00 KiB");
    expect(formatBytes(1024 ** 4)).toBe("1.00 TiB");
    expect(formatBytes(1024 ** 6 * 40)).toBe("40.00 EiB");
  });
});
