import { describe, expect, test } from "bun:test";
import { createLimiter } from "./limit";

describe("createLimiter", () => {
  test("never runs more than max at once and keeps order", async () => {
    const limit = createLimiter(2);
    let running = 0;
    let peak = 0;
    const order: number[] = [];
    const job = (i: number) =>
      limit(async () => {
        running += 1;
        peak = Math.max(peak, running);
        await new Promise((r) => setTimeout(r, 5));
        order.push(i);
        running -= 1;
        return i;
      });
    const results = await Promise.all([0, 1, 2, 3, 4].map(job));
    expect(results).toEqual([0, 1, 2, 3, 4]);
    expect(peak).toBe(2);
    expect(order).toEqual([0, 1, 2, 3, 4]);
  });

  test("a failing job releases its slot", async () => {
    const limit = createLimiter(1);
    await expect(limit(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(await limit(async () => "ok")).toBe("ok");
  });
});
