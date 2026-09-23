/**
 * Initial-JS budget per route, checked against the production build without a browser or the
 * network: sums the gzipped size of the scripts each prerendered page references
 * (.next/server/app/<route>.html). Run after `bun run build`; CI fails when a route grows past its
 * budget, which is how a regression like TASK-070 loading every English message on the dashboard
 * would have been caught (TASK-089).
 *
 *   bun run perf:budget            check against scripts/perf/js-budget.json
 *   bun run perf:budget --update   rewrite the budgets as today's sizes plus the tolerance
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET_FILE = join(import.meta.dir, "js-budget.json");
const APP_DIR = ".next/server/app";
const CHUNKS_DIR = ".next/static/chunks";
/** Headroom added by --update, so small unrelated changes do not fail CI. */
const TOLERANCE = 1.05;

interface Budget {
  /** Route (as the page name under .next/server/app) → max initial JS in KB, gzipped. */
  routes: Record<string, number>;
}

export function scriptChunks(html: string): string[] {
  const found = html.matchAll(/\/_next\/static\/chunks\/([^"'?\s]+\.js)/g);
  return [...new Set([...found].map((m) => m[1]!))].sort();
}

export function initialJsKb(page: string): number {
  const html = readFileSync(join(APP_DIR, `${page}.html`), "utf8");
  const bytes = scriptChunks(html).reduce(
    (sum, chunk) => sum + gzipSync(readFileSync(join(CHUNKS_DIR, chunk))).length,
    0
  );
  return Math.round((bytes / 1024) * 10) / 10;
}

function main() {
  if (!existsSync(APP_DIR)) throw new Error("No production build: run `bun run build` first.");
  const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8")) as Budget;
  const update = process.argv.includes("--update");
  const rows = Object.entries(budget.routes).map(([page, max]) => {
    const kb = initialJsKb(page);
    return { page, kb, max, ok: kb <= max };
  });
  console.table(rows);
  if (update) {
    const routes = Object.fromEntries(rows.map((r) => [r.page, Math.ceil(r.kb * TOLERANCE)]));
    writeFileSync(BUDGET_FILE, `${JSON.stringify({ routes }, null, 2)}\n`);
    console.log(`Budgets rewritten to today's sizes + ${Math.round((TOLERANCE - 1) * 100)} %.`);
    return;
  }
  const over = rows.filter((r) => !r.ok);
  if (over.length > 0) {
    console.error(
      `Initial JS over budget: ${over.map((r) => `${r.page} ${r.kb} KB > ${r.max} KB`).join(", ")}`
    );
    process.exit(1);
  }
}

if (import.meta.main) main();
