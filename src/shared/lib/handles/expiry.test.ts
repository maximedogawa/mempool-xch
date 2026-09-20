import { describe, expect, test } from "bun:test";
import { describeExpiry } from "./expiry";

const NOW = Date.parse("2026-09-20T12:00:00Z");
const inDays = (days: number) => Math.round((NOW + days * 86_400_000) / 1000);

describe("describeExpiry", () => {
  test("counts a term down in the largest unit that still reads naturally", () => {
    expect(describeExpiry(inDays(400), NOW).text).toBe("in 1 year");
    expect(describeExpiry(inDays(330), NOW).text).toBe("in 11 months");
    expect(describeExpiry(inDays(44), NOW).text).toBe("in 44 days");
    expect(describeExpiry(inDays(1), NOW).text).toBe("in 1 day");
    expect(describeExpiry(Math.round(NOW / 1000) + 3600, NOW).text).toBe("in less than a day");
  });

  test("marks the registry's last 30 days as expiring soon", () => {
    expect(describeExpiry(inDays(31), NOW)).toMatchObject({ soon: false, expired: false });
    expect(describeExpiry(inDays(29), NOW)).toMatchObject({ soon: true, expired: false });
    expect(describeExpiry(inDays(1), NOW).soon).toBe(true);
  });

  test("a term that has passed reads as past, and is no longer 'soon'", () => {
    const gone = describeExpiry(inDays(-5), NOW);
    expect(gone).toMatchObject({ expired: true, soon: false });
    expect(gone.text).toBe("5 days ago");
    expect(gone.days).toBeLessThan(0);
  });
});
