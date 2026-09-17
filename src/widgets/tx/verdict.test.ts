import { describe, expect, test } from "bun:test";
import { costVerdict, waitedSeconds } from "./verdict";

describe("waitedSeconds", () => {
  test("difference between first-seen and the end time, in seconds", () => {
    expect(waitedSeconds(1000, 5000)).toBe(4);
  });
  test("null when either side is unknown", () => {
    expect(waitedSeconds(null, 5000)).toBeNull();
    expect(waitedSeconds(1000, null)).toBeNull();
    expect(waitedSeconds(null, null)).toBeNull();
  });
  test("never negative: independent samples can disagree on order", () => {
    expect(waitedSeconds(5000, 1000)).toBe(0);
  });
});

describe("costVerdict", () => {
  test("no cost recorded (inferred summary)", () => {
    expect(costVerdict(0n, 0, 11_000_000_000).label).toBe("No cost recorded");
  });
  test("no fee paid, with the block share", () => {
    const v = costVerdict(0n, 1_100_000_000, 11_000_000_000);
    expect(v.label).toBe("No fee paid");
    expect(v.detail).toContain("10.0% of a block");
  });
  test("fee paid: rate label and block share", () => {
    const v = costVerdict(11_000_000n, 11_000_000, 11_000_000_000);
    expect(v.label).toBe("1.00 mojo/cost");
    expect(v.detail).toContain("0.10% of a block");
  });
});
