/**
 * Small, defensive adapter for the anonymous Grafana/Prometheus responses used by the Chia
 * dashboard. Keeping this separate from rendering means a changed panel shape can fall back to
 * the seeder map without leaking dashboard-specific objects into the UI.
 */

export interface DashboardSeries {
  key: string;
  label: string;
  values: number[];
  times: number[];
}

export interface DashboardBreakdown {
  key: string;
  label: string;
  nodes: number;
}

export interface DashboardSnapshot {
  source: string;
  observedAt: string;
  network: string;
  total: number;
  ipv4: number | null;
  ipv6: number | null;
  capacity: number | null;
  countries: DashboardBreakdown[];
  versions: DashboardBreakdown[];
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" ? (value as UnknownRecord) : null;
}

function finiteValues(value: unknown): number[] {
  return Array.isArray(value) ? value.map(Number).filter((item) => Number.isFinite(item)) : [];
}

function frameSeries(frame: unknown): DashboardSeries | null {
  const source = record(frame);
  const schema = record(source?.schema);
  const data = record(source?.data);
  const fields = Array.isArray(schema?.fields) ? schema.fields.map(record) : [];
  const columns = Array.isArray(data?.values) ? data.values : [];
  if (fields.length === 0 || columns.length === 0) return null;

  const valueIndex = fields.findIndex((field) => {
    const name = String(field?.name ?? "").toLowerCase();
    return name === "value" || name === "count";
  });
  const timeIndex = fields.findIndex((field) => String(field?.name ?? "").toLowerCase() === "time");
  const values = finiteValues(columns[valueIndex >= 0 ? valueIndex : columns.length - 1]);
  if (values.length === 0) return null;
  const times = finiteValues(timeIndex >= 0 ? columns[timeIndex] : []);
  const valueField = record(fields[valueIndex >= 0 ? valueIndex : fields.length - 1]);
  const labels = record(valueField?.labels) ?? {};
  const key = String(
    labels.country_display ?? labels.country ?? labels.version ?? labels.network ?? "value"
  );
  const label = String(
    valueField?.config && record(valueField.config)?.displayNameFromDS
      ? record(valueField.config)?.displayNameFromDS
      : key
  );
  return { key, label, values, times };
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
    .map((series) => ({ key: series.key, label: series.label, nodes: series.values.at(-1) ?? 0 }))
    .filter((item) => item.nodes >= 0)
    .sort((a, b) => b.nodes - a.nodes || a.label.localeCompare(b.label));
}
