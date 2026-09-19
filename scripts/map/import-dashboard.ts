/** Import a public browser capture of /api/ds/query responses. No runtime proxy or credentials.
 * Usage: bun scripts/map/import-dashboard.ts /path/to/capture.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseDashboardBreakdown, parseDashboardMetric } from "../../src/shared/lib/map/dashboard";

const input = process.argv[2];
if (!input) throw new Error("Provide a public dashboard query capture JSON file");
const captures = JSON.parse(readFileSync(input, "utf8"));
const find = (metric: string) => captures.find((r: { request: { queries: { expr?: string }[] } }) =>
  r.request.queries.some(q => q.expr?.includes(metric)));
const metric = (name: string) => parseDashboardMetric(find(name)?.response);
const countryCapture = find("country_display");
const countries = parseDashboardBreakdown(countryCapture?.response);
const total = metric("chia_crawler_total_nodes_5_days");
if (!total || !countries.length) throw new Error("Capture must contain population and country data");
const snapshot = {
  source: "https://dashboard.chia.net/d/em15uQ47k/peer-info",
  observedAt: new Date(Number(countryCapture.request.to)).toISOString(),
  network: "mainnet", total,
  ipv4: metric("chia_crawler_ipv4_nodes_5_days"),
  ipv6: metric("chia_crawler_ipv6_nodes_5_days"),
  capacity: metric("chia_crawler_reliable_nodes"),
  countries,
  versions: parseDashboardBreakdown(find("chia_crawler_peer_version")?.response),
};
writeFileSync("src/shared/lib/map/dashboardSnapshot.json", JSON.stringify(snapshot));
console.log(`Imported ${countries.length} country totals, ${total} nodes, observed ${snapshot.observedAt}`);
