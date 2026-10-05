/**
 * Snapshots Chia's Peer Info dashboard (https://dashboard.chia.net/d/em15uQ47k/peer-info) into
 * src/shared/lib/map/dashboardSnapshot.json (the current panels, shipped with the /map page)
 * and dashboardHistory.json (the time series, loaded by the page after the map).
 *
 * The dashboard is a public Grafana with anonymous access: its panels' queries answer an
 * anonymous POST to /api/ds/query, but without CORS headers, so a browser on another origin
 * cannot read them and the site has no server-side data layer to proxy them. This script runs
 * the same queries the panels run (network "mainnet") from a developer machine and writes the
 * result; nothing about a visitor is involved. Refresh by hand, then commit and deploy:
 *
 *   bun run map:dashboard
 *
 * The page treats a snapshot older than 30 days (SNAPSHOT_MAX_AGE_MS) as stale and falls back
 * to the browser's seeder scan, so refresh at least every two weeks.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  alignSeries,
  parseAsnTable,
  parseDashboardBreakdown,
  parseDashboardMetric,
  parseGrafanaSeries,
  parseSnapshot,
  parseTimeSeries,
  sampleGrid,
  topSeries,
  type DashboardSeries,
  type DashboardSnapshot,
  type DashboardTimeSeries,
} from "../../src/shared/lib/map/dashboard";

const DASHBOARD = "https://dashboard.chia.net";
const SOURCE = `${DASHBOARD}/d/em15uQ47k/peer-info`;
const TARGET = join(import.meta.dir, "../../src/shared/lib/map/dashboardSnapshot.json");
const HISTORY_TARGET = join(import.meta.dir, "../../src/shared/lib/map/dashboardHistory.json");
const NETWORK = "mainnet";
/** The panels' data sources, from the dashboard's boot data (window.grafanaBootData). */
const PROMETHEUS = { uid: "PB06BBC9CA81C548D", type: "prometheus" };
const MYSQL = { uid: "P00A25F4DA48796D5", type: "mysql" };

const DAY = 24 * 60 * 60 * 1000;
/** One sample every three days: enough for a two-year chart, a fraction of the daily size. */
const STEP = 3 * DAY;
/** Population history: two years. */
const HISTORY_SAMPLES = Math.ceil(730 / 3);
/** Version history: one year, six versions (one chart colour each) plus the rest summed. */
const VERSION_SAMPLES = Math.ceil(365 / 3);
const VERSION_KEEP = 6;

/** The panels' own expressions, with the dashboard's `$network` variable filled in. */
const scalar = (metric: string) => `max by (network) (topk(1, ${metric}{network="${NETWORK}"}))`;
const EXPR = {
  total: scalar("chia_crawler_total_nodes_5_days"),
  capacity: scalar("chia_crawler_reliable_nodes"),
  ipv4: scalar("chia_crawler_ipv4_nodes_5_days"),
  ipv6: scalar("chia_crawler_ipv6_nodes_5_days"),
  countries: `max by (country, country_display) (chia_crawler_country_node_count{network="${NETWORK}"})`,
  versions: `max by (version) (chia_crawler_peer_version{network="${NETWORK}"} >= 100)`,
  versionHistory: `max by (version) ((chia_crawler_version_bucket{network="${NETWORK}"} or chia_crawler_peer_version{network="${NETWORK}"}) >= 5)`,
};
const ASN_SQL = `SELECT asn, organization, count FROM \`chia-exporter\`.asn WHERE network = '${NETWORK}' ORDER BY count DESC LIMIT 10000`;

async function query(body: Record<string, unknown>, from: number, to: number): Promise<unknown> {
  const response = await fetch(`${DASHBOARD}/api/ds/query`, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "mempoolxch.space map import" },
    body: JSON.stringify({
      queries: [{ refId: "A", ...body }],
      from: String(from),
      to: String(to),
    }),
  });
  if (!response.ok) throw new Error(`${DASHBOARD} answered HTTP ${response.status}`);
  return response.json();
}

const instant = (expr: string, now: number) =>
  query({ datasource: PROMETHEUS, expr, instant: true }, now - 60 * 60 * 1000, now);

const range = (expr: string, start: number, end: number, step: number) =>
  query(
    {
      datasource: PROMETHEUS,
      expr,
      range: true,
      interval: `${step / 1000}s`,
      intervalMs: step,
      maxDataPoints: Math.ceil((end - start) / step) + 1,
    },
    start,
    end
  );

const now = Date.now();
const [total, capacity, ipv4, ipv6, countriesRaw, versionsRaw, asnRaw] = await Promise.all([
  instant(EXPR.total, now),
  instant(EXPR.capacity, now),
  instant(EXPR.ipv4, now),
  instant(EXPR.ipv6, now),
  instant(EXPR.countries, now),
  instant(EXPR.versions, now),
  query({ datasource: MYSQL, rawSql: ASN_SQL, format: "table" }, now - DAY, now),
]);

const historyEnd = now;
const historyFrom = historyEnd - HISTORY_SAMPLES * STEP;
const [totalRange, capacityRange, ipv4Range, ipv6Range] = await Promise.all(
  [EXPR.total, EXPR.capacity, EXPR.ipv4, EXPR.ipv6].map(async (expr) =>
    parseGrafanaSeries(await range(expr, historyFrom, historyEnd, STEP))
  )
);
// All four answers share one window, so they share Grafana's sample grid.
const grid = sampleGrid(totalRange!, historyFrom, historyEnd, STEP);
const history = (series: DashboardSeries[] | undefined) =>
  alignSeries(series?.[0], grid.start, STEP, grid.count);

const versionFrom = historyEnd - VERSION_SAMPLES * STEP;
const versionSeries = parseGrafanaSeries(
  await range(EXPR.versionHistory, versionFrom, historyEnd, STEP)
);
const versionGrid = sampleGrid(versionSeries, versionFrom, historyEnd, STEP);

const snapshot: DashboardSnapshot = {
  schema: 2,
  source: SOURCE,
  observedAt: new Date(now).toISOString(),
  network: NETWORK,
  total: parseDashboardMetric(total) ?? 0,
  ipv4: parseDashboardMetric(ipv4),
  ipv6: parseDashboardMetric(ipv6),
  capacity: parseDashboardMetric(capacity),
  countries: parseDashboardBreakdown(countriesRaw),
  versions: parseDashboardBreakdown(versionsRaw),
  asns: parseAsnTable(asnRaw),
};

const timeSeries: DashboardTimeSeries = {
  schema: 2,
  observedAt: snapshot.observedAt,
  history: {
    start: grid.start,
    step: STEP,
    total: history(totalRange),
    capacity: history(capacityRange),
    ipv4: history(ipv4Range),
    ipv6: history(ipv6Range),
  },
  versionHistory:
    versionSeries.length > 0
      ? {
          start: versionGrid.start,
          step: STEP,
          series: topSeries(
            versionSeries,
            versionGrid.start,
            STEP,
            versionGrid.count,
            VERSION_KEEP
          ),
        }
      : null,
};

// The page reads the file through the same check; refuse to write one it would reject.
if (!parseSnapshot(snapshot)) {
  throw new Error("The dashboard answered, but not with a complete population and country panel");
}
writeFileSync(TARGET, `${JSON.stringify(snapshot)}\n`);
if (parseTimeSeries(timeSeries)) writeFileSync(HISTORY_TARGET, `${JSON.stringify(timeSeries)}\n`);
else console.warn("No usable time series; the previous history file is kept.");
spawnSync("bunx", ["prettier", "--write", TARGET, HISTORY_TARGET], { stdio: "inherit" });
console.log(
  `Imported ${snapshot.total} nodes in ${snapshot.countries.length} countries, ` +
    `${snapshot.versions.length} versions, ${snapshot.asns?.count ?? 0} ASNs, ` +
    `${grid.count} history samples, observed ${snapshot.observedAt}`
);
