/**
 * IP geolocation for observed node addresses via GeoJS (get.geojs.io: free, CORS `*`, batch
 * lookups, backed by MaxMind GeoLite2 data). Only node IPs learnt from the seeders are ever sent
 * here, never anything about the visitor beyond the request itself. Results are city-level
 * estimates at best and are cached per browser in the node registry (store.ts).
 */
import type { FetchLike } from "./seeders";

export const GEO_ENDPOINT = "https://get.geojs.io/v1/ip/geo.json";
/** GeoJS accepts many IPs per call; keep URLs short and answers small. */
export const GEO_BATCH_SIZE = 25;

export interface NodeGeo {
  countryCode: string;
  country: string;
  city: string | null;
  lat: number;
  lon: number;
  /** Autonomous-system name, e.g. "Deutsche Telekom AG"; null when unknown. */
  org: string | null;
}

interface GeoJsRow {
  ip?: string;
  country?: string;
  country_code?: string;
  city?: string;
  latitude?: string | number;
  longitude?: string | number;
  organization_name?: string;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Map of ip → geo; an IP GeoJS could not place maps to null so it is not asked again. */
export function parseGeoRows(rows: unknown): Map<string, NodeGeo | null> {
  const out = new Map<string, NodeGeo | null>();
  if (!Array.isArray(rows)) return out;
  for (const raw of rows as GeoJsRow[]) {
    if (!raw || typeof raw.ip !== "string") continue;
    const ip = raw.ip.toLowerCase();
    const lat = num(raw.latitude);
    const lon = num(raw.longitude);
    const countryCode =
      typeof raw.country_code === "string" ? raw.country_code.toUpperCase() : null;
    if (lat === null || lon === null || !countryCode) {
      out.set(ip, null);
      continue;
    }
    out.set(ip, {
      countryCode,
      country: typeof raw.country === "string" && raw.country ? raw.country : countryCode,
      city: typeof raw.city === "string" && raw.city ? raw.city : null,
      lat,
      lon,
      org:
        typeof raw.organization_name === "string" && raw.organization_name
          ? raw.organization_name
          : null,
    });
  }
  return out;
}

export async function lookupGeo(
  ips: string[],
  fetchImpl: FetchLike = (i, init) => fetch(i, init),
  signal?: AbortSignal
): Promise<Map<string, NodeGeo | null>> {
  const batch = ips.slice(0, GEO_BATCH_SIZE);
  if (batch.length === 0) return new Map();
  const response = await fetchImpl(
    `${GEO_ENDPOINT}?ip=${batch.map(encodeURIComponent).join(",")}`,
    { signal }
  );
  if (!response.ok) throw new Error(`GeoJS HTTP ${response.status}`);
  const parsed = parseGeoRows(await response.json());
  // An IP missing from the answer is treated like an unplaceable one, so it is not retried forever.
  for (const ip of batch) if (!parsed.has(ip)) parsed.set(ip, null);
  return parsed;
}
