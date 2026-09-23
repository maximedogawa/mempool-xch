/**
 * Small, defensive adapter for the anonymous Grafana/Prometheus responses of Chia's Peer Info
 * dashboard (dashboard.chia.net), plus the shape and checks of the snapshot the import script
 * writes from them. Keeping this separate from rendering means a changed panel shape falls back
 * to the seeder map without leaking dashboard-specific objects into the UI.
 */
import type { NetworkId } from "@/shared/config/networks";

export interface DashboardSeries {
  key: string;
  label: string;
  /** Every label of the value field, e.g. `{ country: "AT", country_display: "Austria" }`. */
  labels: Record<string, string>;
  values: number[];
  times: number[];
}

export interface DashboardBreakdown {
  key: string;
  label: string;
  nodes: number;
  /** ISO 3166-1 alpha-2 when the panel carries one (the country panel does). */
  code?: string;
}

/** One row of the "Peers by ASN" table panel. */
export interface DashboardAsn {
  asn: number;
  organization: string;
  nodes: number;
}

/** Evenly spaced samples: value i was observed at `start + i * step` (Unix ms); null is a gap. */
export interface DashboardHistory {
  start: number;
  step: number;
  total: (number | null)[];
  capacity: (number | null)[];
  ipv4: (number | null)[];
  ipv6: (number | null)[];
}

export interface DashboardVersionHistory {
  start: number;
  step: number;
  /** The largest versions of the window, then one "other" series with the rest summed. */
  series: { label: string; values: (number | null)[] }[];
}

export interface DashboardSnapshot {
  schema: 2;
  source: string;
  observedAt: string;
  network: string;
  total: number;
  ipv4: number | null;
  ipv6: number | null;
  capacity: number | null;
  countries: DashboardBreakdown[];
  versions: DashboardBreakdown[];
  /** The ASN table: how many operators there are and the largest of them. */
  asns: { count: number; nodes: number; top: DashboardAsn[] } | null;
  history: DashboardHistory | null;
  versionHistory: DashboardVersionHistory | null;
}

/** Label of the summed remainder in the version history. */
export const OTHER_VERSIONS = "other";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" ? (value as UnknownRecord) : null;
}

function stringLabels(value: unknown): Record<string, string> {
  const source = record(value) ?? {};
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(source)) if (typeof item === "string") out[key] = item;
  return out;
}

function frameSeries(frame: unknown): DashboardSeries | null {
  const source = record(frame);
  const schema = record(source?.schema);
  const data = record(source?.data);
  const fields = Array.isArray(schema?.fields) ? schema.fields.map(record) : [];
  const columns = Array.isArray(data?.values) ? data.values : [];
  if (fields.length === 0 || columns.length === 0) return null;

  const timeIndex = fields.findIndex((field) => String(field?.name ?? "").toLowerCase() === "time");
  // A Prometheus frame names its value field after the metric; the value is the non-time column.
  const named = fields.findIndex((field) => {
    const name = String(field?.name ?? "").toLowerCase();
    return name === "value" || name === "count";
  });
  const valueIndex =
    named >= 0 ? named : fields.findIndex((_, index) => index !== timeIndex && index >= 0);
  if (valueIndex < 0) return null;
  const rawValues = columns[valueIndex];
  const rawTimes = timeIndex >= 0 ? columns[timeIndex] : [];
  const values: number[] = [];
  const times: number[] = [];
  if (Array.isArray(rawValues)) {
    rawValues.forEach((item, index) => {
      const value = Number(item);
      if (item === null || !Number.isFinite(value)) return;
      values.push(value);
      const time = Array.isArray(rawTimes) ? Number(rawTimes[index]) : NaN;
      if (Number.isFinite(time)) times.push(time);
    });
  }
  if (values.length === 0) return null;
  const valueField = record(fields[valueIndex]);
  const labels = stringLabels(valueField?.labels);
  const key = String(
    labels.country_display ?? labels.country ?? labels.version ?? labels.network ?? "value"
  );
  const config = record(valueField?.config);
  // A panel's legend names the series; without one Grafana echoes the label set ({a="b"}).
  const display = config?.displayNameFromDS;
  const label = typeof display === "string" && display && !display.startsWith("{") ? display : key;
  return { key, label, labels, values, times: times.length === values.length ? times : [] };
}

/** Flatten Grafana's result/frame envelope into small, render-independent series. */
export function parseGrafanaSeries(raw: unknown): DashboardSeries[] {
  const root = record(raw);
  const resultRoot = record(root?.results) ?? root;
  if (!resultRoot) return [];
  const series: DashboardSeries[] = [];
  for (const result of Object.values(resultRoot)) {
    const frames = record(result);
    const list = Array.isArray(frames?.frames) ? frames.frames : [];
    for (const frame of list) {
      const parsed = frameSeries(frame);
      if (parsed) series.push(parsed);
    }
  }
  return series;
}

/** Return the newest finite value from a metric response, or null for an unavailable panel. */
export function parseDashboardMetric(raw: unknown): number | null {
  const values = parseGrafanaSeries(raw).flatMap((series) => series.values);
  return values.length > 0 ? (values[values.length - 1] ?? null) : null;
}

/** Map a country/version/other labelled Prometheus query to descending node counts. */
export function parseDashboardBreakdown(raw: unknown): DashboardBreakdown[] {
  return parseGrafanaSeries(raw)
    .map((series) => {
      const row: DashboardBreakdown = {
        key: series.key,
        label: series.label,
        nodes: series.values.at(-1) ?? 0,
      };
      const code = series.labels.country;
      if (code && /^[A-Za-z]{2}$/.test(code) && series.labels.country_display)
        row.code = code.toUpperCase();
      return row;
    })
    .filter((item) => item.nodes >= 0)
    .sort((a, b) => b.nodes - a.nodes || a.label.localeCompare(b.label));
}

/** Rows of a table-format frame (the ASN panel is SQL): one object per row, keyed by field name. */
export function parseGrafanaTable(raw: unknown): Record<string, unknown>[] {
  const root = record(raw);
  const resultRoot = record(root?.results) ?? root;
  if (!resultRoot) return [];
  const rows: Record<string, unknown>[] = [];
  for (const result of Object.values(resultRoot)) {
    const frames = Array.isArray(record(result)?.frames)
      ? (record(result)!.frames as unknown[])
      : [];
    for (const frame of frames) {
      const fields = record(record(frame)?.schema)?.fields;
      const columns = record(record(frame)?.data)?.values;
      if (!Array.isArray(fields) || !Array.isArray(columns)) continue;
      const names = fields.map((field) => String(record(field)?.name ?? ""));
      const length = Math.max(
        0,
        ...columns.map((column) => (Array.isArray(column) ? column.length : 0))
      );
      for (let i = 0; i < length; i += 1) {
        const row: Record<string, unknown> = {};
        names.forEach((name, index) => {
          const column = columns[index];
          row[name] = Array.isArray(column) ? column[i] : undefined;
        });
        rows.push(row);
      }
    }
  }
  return rows;
}

/** The ASN table as the snapshot keeps it: operator count, node sum and the `limit` largest. */
export function parseAsnTable(raw: unknown, limit = 20): DashboardSnapshot["asns"] {
  const rows = parseGrafanaTable(raw)
    .map((row) => ({
      asn: Number(row.asn),
      organization: typeof row.organization === "string" ? row.organization.trim() : "",
      nodes: Number(row.count),
    }))
    .filter((row) => Number.isInteger(row.asn) && Number.isFinite(row.nodes) && row.nodes > 0)
    .sort((a, b) => b.nodes - a.nodes || a.asn - b.asn);
  if (rows.length === 0) return null;
  return {
    count: rows.length,
    nodes: rows.reduce((sum, row) => sum + row.nodes, 0),
    top: rows.slice(0, limit),
  };
}

/**
 * Places a series on a fixed grid of `count` samples from `start`, `step` apart. A sample
 * takes the value observed nearest to its slot (within half a step); an empty slot is null,
 * so a crawler outage stays a gap instead of a fabricated line.
 */
export function alignSeries(
  series: Pick<DashboardSeries, "values" | "times"> | undefined,
  start: number,
  step: number,
  count: number
): (number | null)[] {
  const out: (number | null)[] = Array.from({ length: count }, () => null);
  if (!series || step <= 0) return out;
  // Grafana adds a trailing sample at the query's end time; keep the one nearest each slot.
  const distance = Array.from({ length: count }, () => Infinity);
  series.times.forEach((time, index) => {
    const slot = Math.round((time - start) / step);
    if (slot < 0 || slot >= count) return;
    const off = Math.abs(time - (start + slot * step));
    const value = series.values[index];
    if (off > step / 2 || off >= distance[slot]! || value === undefined) return;
    distance[slot] = off;
    out[slot] = value;
  });
  return out;
}

/**
 * `keep` series on one grid, then everything else summed into OTHER_VERSIONS. The versions
 * leading at the newest sample come first (up to half of `keep`), the rest by their peak over
 * the window, so both today's releases and the ones that once dominated stay visible.
 */
export function topSeries(
  series: readonly DashboardSeries[],
  start: number,
  step: number,
  count: number,
  keep: number
): DashboardVersionHistory["series"] {
  const aligned = series.map((item) => {
    const values = alignSeries(item, start, step, count);
    return {
      label: item.key,
      values,
      latest: values.at(-1) ?? 0,
      peak: Math.max(0, ...values.map((value) => value ?? 0)),
    };
  });
  const byLatest = [...aligned]
    .filter((item) => item.latest > 0)
    .sort((a, b) => b.latest - a.latest || a.label.localeCompare(b.label));
  const chosen = new Set(byLatest.slice(0, Math.ceil(keep / 2)).map((item) => item.label));
  const byPeak = [...aligned].sort((a, b) => b.peak - a.peak || a.label.localeCompare(b.label));
  for (const item of byPeak) {
    if (chosen.size >= keep) break;
    if (item.peak > 0) chosen.add(item.label);
  }
  const kept = byPeak
    .filter((item) => chosen.has(item.label))
    .map(({ label, values }) => ({ label, values }));
  const rest = aligned.filter((item) => !chosen.has(item.label));
  if (rest.length > 0) {
    const values = Array.from({ length: count }, (_, i) => {
      let sum: number | null = null;
      for (const item of rest) {
        const value = item.values[i];
        if (value !== null && value !== undefined) sum = (sum ?? 0) + value;
      }
      return sum;
    });
    kept.push({ label: OTHER_VERSIONS, values });
  }
  return kept;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function samples(value: unknown, length: number): (number | null)[] | null {
  if (!Array.isArray(value) || value.length !== length) return null;
  return value.map(nullableNumber);
}

function breakdowns(value: unknown): DashboardBreakdown[] | null {
  if (!Array.isArray(value)) return null;
  const out: DashboardBreakdown[] = [];
  for (const item of value) {
    const row = record(item);
    if (!row || typeof row.key !== "string" || typeof row.label !== "string") return null;
    const nodes = nullableNumber(row.nodes);
    if (nodes === null || nodes < 0) return null;
    const entry: DashboardBreakdown = { key: row.key, label: row.label, nodes };
    if (typeof row.code === "string") entry.code = row.code;
    out.push(entry);
  }
  return out;
}

function history(value: unknown): DashboardHistory | null {
  const source = record(value);
  const start = nullableNumber(source?.start);
  const step = nullableNumber(source?.step);
  const total = Array.isArray(source?.total) ? source.total.length : 0;
  if (start === null || step === null || step <= 0 || total === 0) return null;
  const series = {
    total: samples(source?.total, total),
    capacity: samples(source?.capacity, total),
    ipv4: samples(source?.ipv4, total),
    ipv6: samples(source?.ipv6, total),
  };
  if (!series.total || !series.capacity || !series.ipv4 || !series.ipv6) return null;
  return {
    start,
    step,
    total: series.total,
    capacity: series.capacity,
    ipv4: series.ipv4,
    ipv6: series.ipv6,
  };
}

function versionHistory(value: unknown): DashboardVersionHistory | null {
  const source = record(value);
  const start = nullableNumber(source?.start);
  const step = nullableNumber(source?.step);
  if (start === null || step === null || step <= 0 || !Array.isArray(source?.series)) return null;
  const length = Array.isArray(record(source.series[0])?.values)
    ? (record(source.series[0])!.values as unknown[]).length
    : 0;
  const series: DashboardVersionHistory["series"] = [];
  for (const item of source.series) {
    const entry = record(item);
    const values = samples(entry?.values, length);
    if (!entry || typeof entry.label !== "string" || !values) return null;
    series.push({ label: entry.label, values });
  }
  return series.length > 0 && length > 0 ? { start, step, series } : null;
}

/**
 * Validates a snapshot file. Anything that is not a complete schema-2 snapshot is treated as
 * missing (null), which sends the page to the seeder-scan fallback rather than half a map.
 * The optional panels (ASNs, history) may be null on their own without failing the rest.
 */
export function parseSnapshot(raw: unknown): DashboardSnapshot | null {
  const source = record(raw);
  if (!source || source.schema !== 2) return null;
  const total = nullableNumber(source.total);
  const observed = typeof source.observedAt === "string" ? Date.parse(source.observedAt) : NaN;
  const countries = breakdowns(source.countries);
  const versions = breakdowns(source.versions);
  if (
    total === null ||
    total <= 0 ||
    !Number.isFinite(observed) ||
    typeof source.network !== "string" ||
    typeof source.source !== "string" ||
    !countries ||
    countries.length === 0 ||
    !versions
  )
    return null;
  const asnSource = record(source.asns);
  const asnCount = nullableNumber(asnSource?.count);
  const asnNodes = nullableNumber(asnSource?.nodes);
  const asnTop = Array.isArray(asnSource?.top)
    ? asnSource.top.flatMap((item) => {
        const row = record(item);
        const asn = nullableNumber(row?.asn);
        const nodes = nullableNumber(row?.nodes);
        return row && asn !== null && nodes !== null && typeof row.organization === "string"
          ? [{ asn, organization: row.organization, nodes }]
          : [];
      })
    : [];
  return {
    schema: 2,
    source: source.source,
    observedAt: new Date(observed).toISOString(),
    network: source.network,
    total,
    ipv4: nullableNumber(source.ipv4),
    ipv6: nullableNumber(source.ipv6),
    capacity: nullableNumber(source.capacity),
    countries,
    versions,
    asns:
      asnCount !== null && asnNodes !== null && asnTop.length > 0
        ? { count: asnCount, nodes: asnNodes, top: asnTop }
        : null,
    history: history(source.history),
    versionHistory: versionHistory(source.versionHistory),
  };
}

/** A snapshot older than this is not shown as the network's state; the page scans instead. */
export const SNAPSHOT_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type SnapshotState =
  | { mode: "snapshot"; snapshot: DashboardSnapshot; ageMs: number }
  | {
      mode: "scan";
      /** missing: no valid file; network: none for this network; stale: over the age limit. */
      reason: "missing" | "network" | "stale";
      snapshot: DashboardSnapshot | null;
      ageMs: number | null;
    };

/** Decides whether the page draws the dashboard snapshot or falls back to the seeder scan. */
export function snapshotState(
  snapshot: DashboardSnapshot | null,
  network: NetworkId,
  now: number,
  maxAgeMs = SNAPSHOT_MAX_AGE_MS
): SnapshotState {
  if (!snapshot) return { mode: "scan", reason: "missing", snapshot: null, ageMs: null };
  const ageMs = Math.max(0, now - Date.parse(snapshot.observedAt));
  if (snapshot.network !== network) return { mode: "scan", reason: "network", snapshot, ageMs };
  if (ageMs > maxAgeMs) return { mode: "scan", reason: "stale", snapshot, ageMs };
  return { mode: "snapshot", snapshot, ageMs };
}
