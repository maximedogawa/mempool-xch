/**
 * Derives the page's tables, bars and markers from one dashboard snapshot. Pure and
 * synchronous so the widgets stay render-only and the shapes are unit-testable without a DOM:
 * the snapshot is a static file, so every number here is a projection of it, never a fetch.
 */
import { countryPoint, type MapRegion } from "./countryPoints";
import type { DashboardSnapshot } from "./dashboard";

/** Countries the crawler reports but this app has no representative point for. */
export const UNMAPPED = "Unmapped" as const;

export interface CountryRow {
  /** Snapshot key, unique per row and stable across renders. */
  key: string;
  label: string;
  /** ISO 3166-1 alpha-2, or "—" when the country has no point in the table. */
  code: string;
  region: MapRegion | typeof UNMAPPED;
  nodes: number;
  /** Fraction of the whole reported population, 0–1. */
  share: number;
  /** 1-based position by node count. */
  rank: number;
  lat: number | null;
  lon: number | null;
}

/** One row per reported country, largest first, with rank, share and map coordinates. */
export function countryRows(snapshot: DashboardSnapshot): CountryRow[] {
  const total = snapshot.total > 0 ? snapshot.total : 0;
  return [...snapshot.countries]
    .sort((a, b) => b.nodes - a.nodes || a.label.localeCompare(b.label))
    .map((country, index) => {
      const point = countryPoint(country.label);
      return {
        key: country.key,
        label: country.label,
        code: point?.code ?? "—",
        region: point?.region ?? UNMAPPED,
        nodes: country.nodes,
        share: total > 0 ? country.nodes / total : 0,
        rank: index + 1,
        lat: point?.lat ?? null,
        lon: point?.lon ?? null,
      };
    });
}

export interface RegionRow {
  region: MapRegion | typeof UNMAPPED;
  nodes: number;
  countries: number;
  share: number;
  /** Largest country in the region, for the row's subtitle. */
  top: string | null;
}

/** Continent totals, largest first. Regions with no reported nodes are left out. */
export function regionRows(rows: readonly CountryRow[]): RegionRow[] {
  const total = rows.reduce((sum, row) => sum + row.nodes, 0);
  const acc = new Map<
    RegionRow["region"],
    { nodes: number; countries: number; top: string | null }
  >();
  for (const row of rows) {
    const entry = acc.get(row.region) ?? { nodes: 0, countries: 0, top: null };
    entry.nodes += row.nodes;
    entry.countries += 1;
    // Rows arrive largest-first, so the first country seen for a region is its leader.
    entry.top ??= row.label;
    acc.set(row.region, entry);
  }
  return [...acc.entries()]
    .map(([region, entry]) => ({
      region,
      nodes: entry.nodes,
      countries: entry.countries,
      share: total > 0 ? entry.nodes / total : 0,
      top: entry.top,
    }))
    .sort((a, b) => b.nodes - a.nodes || String(a.region).localeCompare(String(b.region)));
}

export interface VersionRow {
  label: string;
  nodes: number;
  /** Fraction of the nodes whose version the crawler knows, 0–1. */
  share: number;
  /** "2.7" for 2.7.4: the release line the build belongs to. */
  line: string;
  /** True for the highest version string in the snapshot. */
  newest: boolean;
}

export interface VersionBreakdown {
  rows: VersionRow[];
  /** Nodes whose version the crawler reports; usually well below the total population. */
  reporting: number;
  /** reporting / total, 0–1: how much of the network the version split speaks for. */
  coverage: number;
  newest: string | null;
}

/** Compares dotted release strings numerically, so 2.7.10 sorts above 2.7.9. */
function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    if (!Number.isFinite(l) || !Number.isFinite(r)) return a.localeCompare(b);
    if (l !== r) return l - r;
  }
  return 0;
}

export function versionBreakdown(snapshot: DashboardSnapshot): VersionBreakdown {
  const reporting = snapshot.versions.reduce((sum, version) => sum + version.nodes, 0);
  const newest =
    [...snapshot.versions].sort((a, b) => compareVersions(a.label, b.label)).at(-1)?.label ?? null;
  const rows = [...snapshot.versions]
    .sort((a, b) => b.nodes - a.nodes || compareVersions(b.label, a.label))
    .map((version) => ({
      label: version.label,
      nodes: version.nodes,
      share: reporting > 0 ? version.nodes / reporting : 0,
      line: version.label.split(".").slice(0, 2).join("."),
      newest: version.label === newest,
    }));
  return {
    rows,
    reporting,
    coverage: snapshot.total > 0 ? reporting / snapshot.total : 0,
    newest,
  };
}

export interface TransportRow {
  label: string;
  nodes: number | null;
  share: number | null;
  hint: string;
}

/**
 * The IPv4 / IPv6 / reliable-node panels as comparable rows. Shares are of the total
 * population; a panel the snapshot does not carry stays null rather than rendering a zero.
 */
export function transportRows(snapshot: DashboardSnapshot): TransportRow[] {
  const share = (value: number | null) =>
    value !== null && snapshot.total > 0 ? value / snapshot.total : null;
  return [
    {
      label: "IPv4",
      nodes: snapshot.ipv4,
      share: share(snapshot.ipv4),
      hint: "Nodes the crawler reached over IPv4 in the last five days.",
    },
    {
      label: "IPv6",
      nodes: snapshot.ipv6,
      share: share(snapshot.ipv6),
      hint: "Nodes the crawler reached over IPv6 in the last five days.",
    },
    {
      label: "Reliable",
      nodes: snapshot.capacity,
      share: share(snapshot.capacity),
      hint: "Nodes stable enough for the crawler to hand out through the DNS introducers.",
    },
  ];
}

/**
 * Concentration of the population: how many of the largest countries it takes to hold half the
 * network, and what the single largest one holds. A one-line read on decentralisation.
 */
export function concentration(rows: readonly CountryRow[]): {
  countriesForHalf: number;
  topShare: number;
  topLabel: string | null;
} {
  const total = rows.reduce((sum, row) => sum + row.nodes, 0);
  let running = 0;
  let countriesForHalf = 0;
  for (const row of rows) {
    if (running >= total / 2) break;
    running += row.nodes;
    countriesForHalf += 1;
  }
  return {
    countriesForHalf,
    // The row's own share, so this agrees with the country table rather than the row sum.
    topShare: rows[0]?.share ?? 0,
    topLabel: rows[0]?.label ?? null,
  };
}
