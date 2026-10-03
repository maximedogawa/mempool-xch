/**
 * The network's size from a nodexch gateway (`GET /x/node/v1/network`): what its own crawler saw
 * in the last five days, by country and version, and the node count per day since 2022. Turned
 * into the shapes the map already draws (the dashboard snapshot and its history), so the page
 * shows a live count where nodexch is the provider and the bundled snapshot everywhere else.
 */
import type { NetworkId } from "@/shared/config/networks";
import { countryPointByCode } from "./countryPoints";
import {
  OTHER_VERSIONS,
  type DashboardBreakdown,
  type DashboardSnapshot,
  type DashboardTimeSeries,
} from "./dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The route's body, as it came. Asked with a plain fetch, not the chain client's: the count comes
 * from the gateway's indexer, and its failure (502, no crawler) must not move the chain reads to
 * the fallback. The route is open; the key is sent anyway so the request counts for the site.
 */
export async function fetchNodexchNetwork(
  gateway: string,
  apiKey: string | null,
  fetchImpl: (url: string, init?: RequestInit) => Promise<Pick<Response, "ok" | "status" | "json">>,
  signal?: AbortSignal
): Promise<unknown> {
  const response = await fetchImpl(`${gateway.replace(/\/$/, "")}/x/node/v1/network`, {
    signal,
    headers: apiKey ? { authorization: `Bearer ${apiKey}` } : undefined,
  });
  if (!response.ok) throw new Error(`nodexch network answered ${response.status}`);
  return response.json();
}

export interface NodexchNetwork {
  snapshot: DashboardSnapshot;
  /** The node count per day; the gateway has no history of versions or address families. */
  series: DashboardTimeSeries | null;
  /** Whose geolocation the country counts rest on, as the gateway asks to be credited. */
  attribution: string | null;
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" ? (value as UnknownRecord) : null;
}

function count(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

function countries(raw: unknown): DashboardBreakdown[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const row = record(item);
    const nodes = count(row?.nodes);
    if (!row || typeof row.country !== "string" || nodes === null || nodes === 0) return [];
    const code = row.country.toUpperCase();
    // The map places countries by name; a code it does not know keeps the code as its name.
    const label = countryPointByCode(code)?.name ?? code;
    return [{ key: label, label, nodes, code }];
  });
}

function versions(raw: unknown): DashboardBreakdown[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const row = record(item);
    const nodes = count(row?.nodes);
    // The summed remainder is not a version: it would rank as one in the breakdown.
    if (!row || typeof row.version !== "string" || nodes === null) return [];
    return row.version === OTHER_VERSIONS ? [] : [{ key: row.version, label: row.version, nodes }];
  });
}

/** One sample per day from the first counted day to the last; a day without a count is a gap. */
function history(raw: unknown, observedAt: string): DashboardTimeSeries | null {
  if (!Array.isArray(raw)) return null;
  const byDay = new Map<number, number>();
  for (const item of raw) {
    const row = record(item);
    const nodes = count(row?.nodes);
    const day = typeof row?.day === "string" ? Date.parse(`${row.day}T00:00:00Z`) : NaN;
    if (nodes !== null && Number.isFinite(day)) byDay.set(day, nodes);
  }
  if (byDay.size < 2) return null;
  const days = [...byDay.keys()];
  const start = Math.min(...days);
  const length = Math.round((Math.max(...days) - start) / DAY_MS) + 1;
  const total = Array.from({ length }, (_, i) => byDay.get(start + i * DAY_MS) ?? null);
  const none: null[] = Array.from({ length }, () => null);
  return {
    schema: 2,
    observedAt,
    history: { start, step: DAY_MS, total, capacity: none, ipv4: none, ipv6: none },
    versionHistory: null,
  };
}

/**
 * Null for anything that is not a complete count (no crawler yet: `latest` is null), which leaves
 * the page on its bundled snapshot rather than half a map.
 */
export function parseNodexchNetwork(
  raw: unknown,
  { network, source }: { network: NetworkId; source: string }
): NodexchNetwork | null {
  const root = record(raw);
  const latest = record(root?.latest);
  const total = count(latest?.nodes);
  const observed = typeof latest?.taken_at === "string" ? Date.parse(latest.taken_at) : NaN;
  const byCountry = countries(root?.countries);
  if (!root || !latest || !total || !Number.isFinite(observed) || byCountry.length === 0)
    return null;
  const observedAt = new Date(observed).toISOString();
  return {
    snapshot: {
      schema: 2,
      source,
      observedAt,
      network,
      total,
      ipv4: count(latest.ipv4),
      ipv6: count(latest.ipv6),
      capacity: count(latest.reliable),
      countries: byCountry,
      versions: versions(latest.versions),
      asns: null,
    },
    series: history(root.history, observedAt),
    attribution: typeof root.attribution === "string" && root.attribution ? root.attribution : null,
  };
}
