import { describe, expect, test } from "bun:test";
import { formatTable, summarise, type ProbeRow } from "./probeReport";

const rows: ProbeRow[] = [
  { method: "get_blockchain_state", status: "ok", ms: 12, note: "peak 9,329,726 · syncing" },
  { method: "get_fee_estimate", status: "error", ms: 30, note: "rpc: not synced" },
  { method: "get_mempool_item_by_tx_id", status: "skipped", ms: null, note: "mempool empty" },
  { method: "get_transaction", status: "expected-unavailable", ms: null, note: "Coinset only" },
];

describe("node probe report", () => {
  test("counts each outcome and is healthy only without failures", () => {
    expect(summarise(rows)).toEqual({ ok: 1, errors: 1, skipped: 1, expected: 1, healthy: false });
    expect(summarise(rows.filter((r) => r.status !== "error")).healthy).toBe(true);
  });

  test("prints one aligned line per method and the totals", () => {
    const table = formatTable(rows).split("\n");
    expect(table[0]).toMatch(/^ok\s+get_blockchain_state\s+12 ms {2}peak/);
    expect(table[1]).toMatch(/^FAIL\s+get_fee_estimate/);
    expect(table[2]).toMatch(/^skip\s+get_mempool_item_by_tx_id\s+ {2}mempool empty$/);
    expect(table[3]).toMatch(/^n\/a\s+get_transaction/);
    expect(table.at(-1)).toBe("1 ok, 1 failed, 1 skipped, 1 Coinset-only (not on a plain node)");
    // The method column starts at the same offset on every line.
    table
      .slice(0, 4)
      .forEach((line, i) => expect(line.slice(6).startsWith(rows[i]!.method)).toBe(true));
  });
});
