/**
 * The set of full nodes this browser has observed through the seeders, with their cached
 * locations. Pure functions over a plain object so the scanner hook can persist it to
 * localStorage per network and the tests need no DOM. Bounded: the least recently seen nodes
 * go first once MAX_NODES is reached, and nodes not seen for MAX_AGE_MS are pruned on load.
 */
import type { NodeGeo } from "./geo";

export interface ObservedNode {
  ip: string;
  /** Unix ms of the first and the latest seeder answer that contained this address. */
  firstSeen: number;
  lastSeen: number;
  /** How many seeder answers included it (a rough reachability signal). */
  hits: number;
  /** Cached location; undefined = not looked up yet, null = GeoJS could not place it. */
  geo?: NodeGeo | null;
}

export interface NodeRegistry {
  version: 1;
  nodes: Record<string, ObservedNode>;
}

export const REGISTRY_KEY_PREFIX = "mempool-xch:nodes:v1:";
export const MAX_NODES = 3_000;
/** Nodes the seeders stopped handing out for this long are forgotten. */
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function emptyRegistry(): NodeRegistry {
  return { version: 1, nodes: {} };
}

export function parseRegistry(raw: string | null | undefined, now = Date.now()): NodeRegistry {
  if (!raw) return emptyRegistry();
  try {
    const parsed = JSON.parse(raw) as Partial<NodeRegistry>;
    if (!parsed || parsed.version !== 1 || !parsed.nodes || typeof parsed.nodes !== "object")
      return emptyRegistry();
    const nodes: Record<string, ObservedNode> = {};
    for (const [ip, node] of Object.entries(parsed.nodes)) {
      if (!node || typeof node !== "object" || typeof node.lastSeen !== "number") continue;
      if (now - node.lastSeen > MAX_AGE_MS) continue;
      nodes[ip] = {
        ip,
        firstSeen: typeof node.firstSeen === "number" ? node.firstSeen : node.lastSeen,
        lastSeen: node.lastSeen,
        hits: typeof node.hits === "number" ? node.hits : 1,
        geo: node.geo,
      };
    }
    return { version: 1, nodes: evict(nodes) };
  } catch {
    return emptyRegistry();
  }
}

/** Records one seeder answer; returns the new registry and which addresses were new. */
export function mergeObserved(
  registry: NodeRegistry,
  ips: readonly string[],
  now = Date.now()
): { registry: NodeRegistry; added: string[] } {
  const nodes = { ...registry.nodes };
  const added: string[] = [];
  for (const ip of ips) {
    const existing = nodes[ip];
    if (existing) nodes[ip] = { ...existing, lastSeen: now, hits: existing.hits + 1 };
    else {
      nodes[ip] = { ip, firstSeen: now, lastSeen: now, hits: 1 };
      added.push(ip);
    }
  }
  return { registry: { version: 1, nodes: evict(nodes) }, added };
}

function evict(nodes: Record<string, ObservedNode>): Record<string, ObservedNode> {
  const entries = Object.values(nodes);
  if (entries.length <= MAX_NODES) return nodes;
  entries.sort((a, b) => b.lastSeen - a.lastSeen);
  return Object.fromEntries(entries.slice(0, MAX_NODES).map((n) => [n.ip, n]));
}

export function applyGeo(
  registry: NodeRegistry,
  results: Map<string, NodeGeo | null>
): NodeRegistry {
  if (results.size === 0) return registry;
  const nodes = { ...registry.nodes };
  for (const [ip, geo] of results) {
    const node = nodes[ip];
    if (node) nodes[ip] = { ...node, geo };
  }
  return { version: 1, nodes };
}

/** Addresses still waiting for a location, most recently seen first. */
export function pendingGeo(registry: NodeRegistry, limit: number): string[] {
  return Object.values(registry.nodes)
    .filter((n) => n.geo === undefined)
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, limit)
    .map((n) => n.ip);
}

export interface CountryCount {
  countryCode: string;
  country: string;
  nodes: number;
  share: number;
}

export function countByCountry(registry: NodeRegistry): CountryCount[] {
  const acc = new Map<string, { country: string; nodes: number }>();
  let located = 0;
  for (const node of Object.values(registry.nodes)) {
    if (!node.geo) continue;
    located += 1;
    const entry = acc.get(node.geo.countryCode) ?? { country: node.geo.country, nodes: 0 };
    entry.nodes += 1;
    acc.set(node.geo.countryCode, entry);
  }
  return [...acc.entries()]
    .map(([countryCode, { country, nodes }]) => ({
      countryCode,
      country,
      nodes,
      share: located > 0 ? nodes / located : 0,
    }))
    .sort((a, b) => b.nodes - a.nodes || a.country.localeCompare(b.country));
}

export interface NodeCluster {
  /** Rounded to CLUSTER_DEGREES so nearby nodes share one marker. */
  key: string;
  lat: number;
  lon: number;
  nodes: ObservedNode[];
  /** Most common city/country label among the members. */
  label: string;
}

export const CLUSTER_DEGREES = 1;

/** Groups located nodes into map markers; one marker per CLUSTER_DEGREES cell, largest first. */
export function clusterNodes(nodes: Iterable<ObservedNode>): NodeCluster[] {
  const acc = new Map<string, NodeCluster & { labels: Map<string, number> }>();
  for (const node of nodes) {
    if (!node.geo) continue;
    const lat = Math.round(node.geo.lat / CLUSTER_DEGREES) * CLUSTER_DEGREES;
    const lon = Math.round(node.geo.lon / CLUSTER_DEGREES) * CLUSTER_DEGREES;
    const key = `${lat},${lon}`;
    const cluster = acc.get(key) ?? {
      key,
      lat,
      lon,
      nodes: [] as ObservedNode[],
      label: "",
      labels: new Map<string, number>(),
    };
    cluster.nodes.push(node);
    const label = node.geo.city ? `${node.geo.city}, ${node.geo.country}` : node.geo.country;
    cluster.labels.set(label, (cluster.labels.get(label) ?? 0) + 1);
    acc.set(key, cluster);
  }
  return [...acc.values()]
    .map(({ labels, ...cluster }) => ({
      ...cluster,
      label: [...labels.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "",
    }))
    .sort((a, b) => b.nodes.length - a.nodes.length);
}
