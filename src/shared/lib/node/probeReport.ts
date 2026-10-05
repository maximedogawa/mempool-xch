/**
 * Result rows of the node probe (scripts/node/probe.ts) and how they are summarised. Pure, so
 * the report can be unit-tested without a node.
 */
export type ProbeStatus = "ok" | "error" | "skipped" | "expected-unavailable";

export interface ProbeRow {
  method: string;
  status: ProbeStatus;
  /** Round trip in ms; null when the method was not called. */
  ms: number | null;
  /** What came back, or why it failed or was skipped. */
  note: string;
}

export interface ProbeSummary {
  ok: number;
  errors: number;
  skipped: number;
  expected: number;
  /** Every standard method the node was asked answered. */
  healthy: boolean;
}

export function summarise(rows: readonly ProbeRow[]): ProbeSummary {
  const count = (s: ProbeStatus) => rows.filter((r) => r.status === s).length;
  const errors = count("error");
  return {
    ok: count("ok"),
    errors,
    skipped: count("skipped"),
    expected: count("expected-unavailable"),
    healthy: errors === 0,
  };
}

const MARK: Record<ProbeStatus, string> = {
  ok: "ok",
  error: "FAIL",
  skipped: "skip",
  "expected-unavailable": "n/a",
};

/** A fixed-width text table: one line per method, then the totals. */
export function formatTable(rows: readonly ProbeRow[]): string {
  const width = Math.max(6, ...rows.map((r) => r.method.length));
  const lines = rows.map((r) => {
    const ms = r.ms === null ? "" : `${r.ms} ms`;
    return `${MARK[r.status].padEnd(5)} ${r.method.padEnd(width)} ${ms.padStart(8)}  ${r.note}`;
  });
  const s = summarise(rows);
  lines.push(
    "",
    `${s.ok} ok, ${s.errors} failed, ${s.skipped} skipped, ${s.expected} Coinset-only (not on a plain node)`
  );
  return lines.join("\n");
}
