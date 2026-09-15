import { describe, expect, test } from "bun:test";
import { formatAge, formatDuration, formatEta } from "./time";

describe("time formatting", () => {
  const now = 1_000_000_000_000;
  test("formatAge", () => {
    expect(formatAge(now - 1000, now)).toBe("just now");
    expect(formatAge(now - 30_000, now)).toBe("30s ago");
    expect(formatAge(now - 5 * 60_000, now)).toBe("5m ago");
    expect(formatAge(now - 3 * 3_600_000 - 5 * 60_000, now)).toBe("3h 5m ago");
    expect(formatAge(now - 2 * 86_400_000, now)).toBe("2d 0h ago");
  });
  test("formatEta", () => {
    expect(formatEta(0)).toBe("next block");
    expect(formatEta(45)).toBe("~45 s");
    expect(formatEta(150)).toBe("~3 min");
    expect(formatEta(5400)).toBe("~1.5 h");
  });
  test("formatDuration", () => {
    expect(formatDuration(59)).toBe("59s");
    expect(formatDuration(125)).toBe("2m 5s");
    expect(formatDuration(3725)).toBe("1h 2m");
  });
});
