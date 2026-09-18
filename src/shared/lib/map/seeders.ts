/**
 * Where node addresses come from. Chia nodes bootstrap through DNS introducers ("seeders"): a
 * DNS query for one of these names answers with a rotating batch of reachable full-node IPs
 * (32 per query on mainnet). Asking repeatedly walks through the seeder's view of the network,
 * which is what the map page's scanner does. The names are the defaults chia-blockchain ships
 * in its config (`full_node.dns_servers`).
 */
import type { NetworkId } from "@/shared/config/networks";

export const SEEDERS: Record<NetworkId, readonly string[]> = {
  mainnet: [
    "dns-introducer.chia.net",
    "chia.ctrlaltdel.ch",
    "seeder.dexie.space",
    "chia.hoffmang.com",
    "seeder.xchpool.org",
  ],
  testnet11: ["dns-introducer-testnet11.chia.net"],
};

export type DnsRecordType = "A" | "AAAA";

export interface DohResponse {
  Status?: number;
  Answer?: { name?: string; type?: number; TTL?: number; data?: string }[];
}

/** Cloudflare's DNS-over-HTTPS JSON endpoint (CORS `*`), with Google's as a fallback. */
export const DOH_ENDPOINTS = [
  "https://cloudflare-dns.com/dns-query",
  "https://dns.google/resolve",
] as const;

const RECORD_TYPE_CODE: Record<DnsRecordType, number> = { A: 1, AAAA: 28 };

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6 = /^[0-9a-f:]+$/i;

export function isPublicIp(ip: string): boolean {
  const v4 = IPV4.exec(ip);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 169 && b === 254) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    return true;
  }
  if (IPV6.test(ip) && ip.includes(":")) {
    const lower = ip.toLowerCase();
    return !(
      lower === "::1" ||
      lower.startsWith("fe80") ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower === "::"
    );
  }
  return false;
}

/** The IPs in a DoH answer for the requested record type; anything private or malformed is dropped. */
export function parseDohAnswer(body: DohResponse, type: DnsRecordType): string[] {
  if (body.Status !== undefined && body.Status !== 0) return [];
  const code = RECORD_TYPE_CODE[type];
  const out = new Set<string>();
  for (const answer of body.Answer ?? []) {
    if (answer.type !== code || typeof answer.data !== "string") continue;
    const ip = answer.data.trim().toLowerCase();
    if (isPublicIp(ip)) out.add(ip);
  }
  return [...out];
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** One seeder query over DoH; tries each endpoint in turn and returns the first usable answer. */
export async function resolveSeeder(
  name: string,
  type: DnsRecordType,
  fetchImpl: FetchLike = (i, init) => fetch(i, init),
  signal?: AbortSignal
): Promise<string[]> {
  let lastError: unknown = null;
  for (const endpoint of DOH_ENDPOINTS) {
    try {
      const response = await fetchImpl(
        `${endpoint}?name=${encodeURIComponent(name)}&type=${type}`,
        { headers: { accept: "application/dns-json" }, signal }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return parseDohAnswer((await response.json()) as DohResponse, type);
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }
  throw lastError ?? new Error("DNS lookup failed");
}
