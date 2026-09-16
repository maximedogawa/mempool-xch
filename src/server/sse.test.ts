import { describe, expect, test } from "bun:test";
import { formatSseControl, formatSseEvent, parseLastEventId } from "./sse";

describe("sse framing", () => {
  test("formats a hub event with id, event name and json data", () => {
    const text = formatSseEvent({ seq: 42, at: 1_000, event: { type: "peak", height: 7, tx: true } });
    expect(text).toBe('id: 42\nevent: peak\ndata: {"height":7,"tx":true,"at":1000}\n\n');
  });
  test("mempool deltas are sent as counts", () => {
    const text = formatSseEvent({ seq: 1, at: 5, event: { type: "mempool_delta", added: [{ id: "a", firstSeenMs: null, fee: "0", cost: 1 }], removed: ["b", "c"] } });
    expect(text).toBe('id: 1\nevent: mempool_delta\ndata: {"added":1,"removed":2,"at":5}\n\n');
  });
  test("control messages carry no id", () => {
    expect(formatSseControl("resync", { reason: "x" })).toBe('event: resync\ndata: {"reason":"x"}\n\n');
  });
  test("Last-Event-ID wins over the query and must be a non-negative integer", () => {
    expect(parseLastEventId("12", "3")).toBe(12);
    expect(parseLastEventId(null, "3")).toBe(3);
    expect(parseLastEventId("abc", null)).toBeNull();
    expect(parseLastEventId(null, null)).toBeNull();
  });
});
